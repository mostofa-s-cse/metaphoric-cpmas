<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ReportController extends Controller
{
    public function page()
    {
        return Inertia::render('Dashboard/Reports/Index');
    }
}
