<?php

namespace App\Http\Controllers;

use App\Models\CashOut;
use App\Models\Material;
use App\Models\Supplier;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MaterialController extends Controller
{
    use ApiResponse;

    const PATH = '/materials';

    public function index(Request $request)
    {
        $search = $request->get('search', '');
        $projectId = $request->get('projectId');
        $supplierId = $request->get('supplierId');
        $page = (int) $request->get('page', 1);
        $limit = (int) $request->get('limit', 10);
        $skip = ($page - 1) * $limit;

        $query = Material::with(['supplier:id,name', 'project:id,name,code']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('category', 'like', "%{$search}%");
            });
        }
        if ($projectId) $query->where('projectId', $projectId);
        if ($supplierId) $query->where('supplierId', $supplierId);

        $total = $query->count();
        $materials = $query->orderBy('created_at', 'desc')->skip($skip)->take($limit)->get();

        return $this->apiPaginated('materials', $materials, $total, $page, $limit,
            'Materials retrieved successfully', self::PATH);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role === 'ACCOUNTANT') {
            return $this->apiForbidden(self::PATH, 'Accountants are not permitted to register daily material inventory records');
        }

        $data = $request->validate([
            'name' => 'required|string',
            'category' => 'required|string',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string',
            'unitPrice' => 'required|numeric|min:0',
            'supplierId' => 'required|uuid|exists:suppliers,id',
            'projectId' => 'required|uuid|exists:projects,id',
            'purchaseDate' => 'required|date',
            'invoiceNumber' => 'nullable|string',
        ]);

        $total = (float) $data['quantity'] * (float) $data['unitPrice'];
        $data['totalPrice'] = $total;

        [$material, $cashOut] = DB::transaction(function () use ($data, $total) {
            $material = Material::create($data);

            $cashOut = CashOut::create([
                'date' => $data['purchaseDate'],
                'projectId' => $data['projectId'],
                'expenseCategory' => 'MATERIALS',
                'paidTo' => "Material Purchase: {$data['name']}",
                'amount' => $total,
                'paymentMethod' => 'CASH',
                'referenceNumber' => $data['invoiceNumber'] ?? null,
                'notes' => "Auto-generated from Material Purchase registry. Qty: {$data['quantity']} {$data['unit']} @ \${$data['unitPrice']}/{$data['unit']}",
                'supplierId' => $data['supplierId'],
                'materialId' => $material->id,
            ]);

            $supplier = Supplier::findOrFail($data['supplierId']);
            $supplier->currentDue = (float) $supplier->currentDue + $total;
            $supplier->save();

            return [$material, $cashOut];
        });

        return $this->apiCreated(
            [
                'material' => $material->load(['supplier:id,name', 'project:id,name,code']),
                'cashOut' => $cashOut,
            ],
            'Material purchase recorded successfully', self::PATH);
    }

    public function show(string $id)
    {
        $material = Material::with(['supplier:id,name', 'project:id,name,code'])->findOrFail($id);
        return $this->apiSuccess(['material' => $material], 'Material retrieved successfully', self::PATH);
    }

    public function update(Request $request, string $id)
    {
        $material = Material::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string',
            'category' => 'sometimes|string',
            'quantity' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string',
            'unitPrice' => 'sometimes|numeric|min:0',
            'supplierId' => 'sometimes|uuid|exists:suppliers,id',
            'projectId' => 'sometimes|uuid|exists:projects,id',
            'purchaseDate' => 'sometimes|date',
            'invoiceNumber' => 'nullable|string',
        ]);

        // totalPrice is always server-derived, never trusted from the client.
        if (array_key_exists('quantity', $data) || array_key_exists('unitPrice', $data)) {
            $quantity = $data['quantity'] ?? $material->quantity;
            $unitPrice = $data['unitPrice'] ?? $material->unitPrice;
            $data['totalPrice'] = (float) $quantity * (float) $unitPrice;
        }

        $material->update($data);

        return $this->apiSuccess(['material' => $material->fresh(['supplier', 'project'])],
            'Material updated successfully', self::PATH);
    }

    public function destroy(string $id)
    {
        if (!in_array(Auth::user()->role, ['SUPER_ADMIN', 'ADMIN'])) {
            return $this->apiForbidden(self::PATH, 'Forbidden: Only administrators can delete materials');
        }

        $material = Material::findOrFail($id);

        DB::transaction(function () use ($material) {
            if ($material->supplierId) {
                $supplier = Supplier::find($material->supplierId);
                if ($supplier) {
                    $supplier->currentDue = (float) $supplier->currentDue - (float) $material->totalPrice;
                    $supplier->save();
                }
            }

            // Delete associated auto-generated CashOut record(s), loading models
            // individually so the Auditable model events (and thus audit log) fire.
            CashOut::where('materialId', $material->id)->get()->each->delete();

            $material->delete();
        });

        return $this->apiSuccess(null, 'Material purchase record deleted successfully', self::PATH);
    }

    public function page()
    {
        return Inertia::render('Dashboard/Materials/Index');
    }
}
