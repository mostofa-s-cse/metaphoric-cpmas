'use client';

/**
 * CPMAS — Document Repository
 * Powered by RTK Query, React Hook Form, and Zod validation.
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Pagination } from '@/components/ui/Pagination';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  useGetDocumentsQuery,
  useGetProjectsListQuery,
  useGetSuppliersQuery,
  useGetVendorsQuery,
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  ApiDocument,
} from '@/store/api/cpmasApi';
import { documentSchema, DocumentFormValues } from '@/lib/schemas';
import {
  FileText,
  Plus,
  Search,
  FolderKanban,
  Truck,
  Briefcase,
  X,
  Trash2,
  Loader2,
  FileSpreadsheet,
  FileCode,
  FileImage,
  ExternalLink,
  Upload,
  Download,
} from 'lucide-react';

export default function DocumentsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Queries & Mutations
  const { data: docData, isLoading: isFetchingDocs, error: docError, refetch: refetchDocs } = useGetDocumentsQuery();
  const { data: prjData } = useGetProjectsListQuery();
  const { data: supData } = useGetSuppliersQuery();
  const { data: ctrData } = useGetVendorsQuery();
  const [createDocument, { isLoading: isCreating }] = useCreateDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const documents = docData?.documents || [];
  const projects = prjData?.projects || [];
  const suppliers = supData?.suppliers || [];
  const vendors = ctrData?.vendors || [];

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewDoc, setViewDoc] = useState<ApiDocument | null>(null);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      url: '/uploads/mock_file.pdf', // default mock URL to satisfy Zod schema
      fileType: 'PDF',
      category: 'CONTRACT',
      projectId: '',
      supplierId: '',
      vendorId: '',
      description: '',
    },
    mode: 'all',
  });

  const handleOpenCreate = () => {
    reset({
      name: '',
      url: '/uploads/mock_file.pdf',
      fileType: 'PDF',
      category: 'CONTRACT',
      projectId: '',
      supplierId: '',
      vendorId: '',
      description: '',
    });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const onSubmit = async (values: DocumentFormValues) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to server');
      }

      const uploadData = await uploadRes.json();

      const payload = {
        ...values,
        url: uploadData.url,
        fileType: selectedFile.name.split('.').pop()?.toUpperCase() || values.fileType,
        projectId: values.projectId || null,
        supplierId: values.supplierId || null,
        vendorId: values.vendorId || null,
      };

      await toast.handlePromise(createDocument(payload).unwrap());
      refetchDocs();
      setIsModalOpen(false);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await toast.handlePromise(deleteDocument(deleteId).unwrap());
      refetchDocs();
      setDeleteId(null);
    } catch (err: any) {
      // toast.handlePromise already handled the error toast
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF':
        return <FileText className="h-6 w-6 text-rose-500" />;
      case 'EXCEL':
      case 'XLSX':
        return <FileSpreadsheet className="h-6 w-6 text-emerald-400" />;
      case 'IMAGE':
      case 'PNG':
      case 'JPG':
        return <FileImage className="h-6 w-6 text-blue-400" />;
      default:
        return <FileCode className="h-6 w-6 text-slate-400" />;
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchesProject =
      projectFilter === 'ALL'
        ? true
        : projectFilter === 'GENERAL'
        ? !doc.projectId
        : doc.projectId === projectFilter;

    return matchesSearch && matchesCategory && matchesProject;
  });

  useEffect(() => { setPage(1); }, [searchTerm, categoryFilter, projectFilter]);

  const paginatedDocuments = filteredDocuments.slice((page - 1) * limit, page * limit);

  const isFetching = isFetchingDocs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 flex items-center gap-2">
            <FileText className="h-5.5 w-5.5 text-cyan-400" />
            Document Repository
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Store and organize contracts, invoices, challans, quotations and legal paperwork.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          icon={<Upload className="h-4.5 w-4.5" />}
        >
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs placeholder:text-slate-600 transition-all"
          />
        </div>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-slate-900/40 border border-slate-800 focus:border-cyan-500/80 rounded-xl text-slate-450 focus:outline-none text-xs transition-all cursor-pointer md:w-[220px]"
        >
          <option value="ALL">All Projects</option>
          <option value="GENERAL">General Corporate (No Project)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'CONTRACT', 'INVOICE', 'CHALLAN', 'QUOTATION', 'OTHER'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-2 border rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {isFetching ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <span className="text-slate-500 text-xs font-semibold">Loading document files...</span>
        </div>
      ) : docError ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-6">
          <FileText className="h-10 w-10 text-rose-500 mb-3" />
          <p className="text-slate-350 text-sm font-semibold">Failed to load documents index</p>
          <p className="text-slate-500 text-xs mt-1">Please try refreshing the page.</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="h-96 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center bg-slate-900/10 text-center px-4">
          <FileText className="h-12 w-12 text-slate-800 mb-3" />
          <p className="text-slate-400 text-sm font-bold">No documents found</p>
          <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">
            {searchTerm || categoryFilter !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'Register a work contract or material invoice to store legal records.'}
          </p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900/25 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex items-start gap-4 hover:shadow-xl group backdrop-blur-md"
            >
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl shrink-0">
                {getFileIcon(doc.fileType)}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                <div>
                  <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest block font-mono">
                    {doc.category}
                  </span>
                  <h3 className="font-bold text-slate-200 text-sm truncate mt-1 group-hover:text-cyan-300 transition-colors">
                    {doc.name}
                  </h3>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                  </p>
                  {doc.description && (
                    <p className="text-slate-400 text-[11px] mt-2 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* Related Links */}
                  <div className="mt-3.5 space-y-1.5 border-t border-slate-800/40 pt-3">
                    {doc.project && (
                      <div className="flex items-center text-[10px] text-slate-500 gap-1.5 font-medium">
                        <FolderKanban className="h-3 w-3 shrink-0 text-slate-600" />
                        <span className="truncate">Project: {doc.project.name}</span>
                      </div>
                    )}
                    {doc.supplier && (
                      <div className="flex items-center text-[10px] text-slate-500 gap-1.5 font-medium">
                        <Truck className="h-3 w-3 shrink-0 text-slate-600" />
                        <span className="truncate">Supplier: {doc.supplier.name}</span>
                      </div>
                    )}
                    {doc.vendor && (
                      <div className="flex items-center text-[10px] text-slate-500 gap-1.5 font-medium">
                        <Briefcase className="h-3 w-3 shrink-0 text-slate-600" />
                        <span className="truncate">Vendor: {doc.vendor.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setViewDoc(doc)}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View File</span>
                    </button>
                    <a
                      href={doc.url.replace(/^\/public\//, '/')}
                      download={doc.name}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>

                  {user?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleDeleteClick(doc.id)}
                      className="p-1 text-slate-500 hover:text-rose-455 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded transition-all cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filteredDocuments.length / limit)}
          totalItems={filteredDocuments.length}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
        </>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Upload className="h-4.5 w-4.5 text-cyan-400" />
                Upload New Document
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Document Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Skyline Piling Contract"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                      errors.name
                        ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                    }`}
                  />
                  {errors.name && <p className="text-rose-400 text-[10px] mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">File Type</label>
                  <select
                    {...register('fileType')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="PDF">PDF</option>
                    <option value="IMAGE">IMAGE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Document Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="CONTRACT">Contract / Deed</option>
                    <option value="INVOICE">Expense Invoice / Bill</option>
                    <option value="CHALLAN">Material Challan / Delivery</option>
                    <option value="QUOTATION">Supplier Quotation</option>
                    <option value="OTHER">Other Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Link to Project</label>
                  <select
                    {...register('projectId')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="">General Corporate (No Project)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Link to Supplier</label>
                  <select
                    {...register('supplierId')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="">No Supplier Link</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-2">Link to Vendor</label>
                  <select
                    {...register('vendorId')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer"
                  >
                    <option value="">No Vendor Link</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Upload File (PDF/Image)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 text-xs transition-all cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 mb-4"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Brief Description</label>
                <textarea
                  rows={2}
                  {...register('description')}
                  placeholder="e.g. Skyline Heights foundation piling execution contract..."
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-slate-200 focus:outline-none focus:ring-1 text-xs transition-all ${
                    errors.description
                      ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                  }`}
                />
                {errors.description && <p className="text-rose-400 text-[10px] mt-1">{errors.description.message}</p>}
              </div>

              <div className="pt-4 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isUploading || isCreating}
                >
                  Upload File
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-cyan-400" />
                {viewDoc.name}
              </h2>
              <div className="flex items-center gap-3">
                <a
                  href={viewDoc.url.replace(/^\/public\//, '/')}
                  download={viewDoc.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg text-slate-350 hover:text-slate-100 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setViewDoc(null)}
                  className="text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-950/50 p-4 flex items-center justify-center">
              {viewDoc.fileType?.toUpperCase() === 'PDF' ? (
                <iframe
                  src={viewDoc.url.replace(/^\/public\//, '/')}
                  className="w-full h-full rounded-xl border border-slate-800"
                  title={viewDoc.name}
                />
              ) : ['IMAGE', 'PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(viewDoc.fileType?.toUpperCase()) ? (
                <img
                  src={viewDoc.url.replace(/^\/public\//, '/')}
                  alt={viewDoc.name}
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Preview not available for this file type.</p>
                  <a
                    href={viewDoc.url.replace(/^\/public\//, '/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* shadcn-style Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the document record from the ledger and completely purge the physical file from the server's storage disk."
        confirmText="Delete"
        isConfirming={isDeleting}
      />
    </div>
  );
}
