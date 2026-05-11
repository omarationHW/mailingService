import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contactListsApi, ContactList, ContactListMember } from '../api/contactLists';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import {
  ArrowLeft, UserPlus, Trash2, Mail, Building2, Phone,
  X, Search, Users, List, AlertTriangle, Tag, ChevronLeft, ChevronRight,
  ChevronDown, Filter,
} from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmModal {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
const MODAL_CLOSED: ConfirmModal = { open: false, title: '', message: '', onConfirm: () => {} };

const LIMIT_OPTIONS = [25, 50, 100];

export default function ContactListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [list, setList] = useState<ContactList | null>(null);
  const [members, setMembers] = useState<ContactListMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [memberSearch, setMemberSearch] = useState('');

  // Filters
  const [companyFilter, setCompanyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [metaCompanies, setMetaCompanies] = useState<string[]>([]);
  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Batch selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchRemoving, setBatchRemoving] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [addContactsPage, setAddContactsPage] = useState(1);
  const [addContactsTotal, setAddContactsTotal] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchContacts, setSearchContacts] = useState('');
  const [adding, setAdding] = useState(false);
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);

  const loadList = useCallback(async () => {
    try {
      const data = await contactListsApi.getById(id!);
      setList(data.list);
    } catch {
      toast.error('Error al cargar lista');
      navigate('/contact-lists');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadMeta = useCallback(async () => {
    try {
      const data = await contactListsApi.getListMeta(id!);
      setMetaCompanies(data.companies);
      setMetaTags(data.tags);
    } catch { /* non-critical */ }
  }, [id]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const data = await contactListsApi.getContacts(id!, {
        page,
        limit,
        search: memberSearch || undefined,
        company: companyFilter || undefined,
        tags: tagFilter.length > 0 ? tagFilter.join(',') : undefined,
      });
      setMembers(data.members);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Error al cargar miembros');
    } finally {
      setMembersLoading(false);
    }
  }, [id, page, limit, memberSearch, companyFilter, tagFilter]);

  useEffect(() => { loadList(); loadMeta(); }, [loadList, loadMeta]);

  useEffect(() => {
    const t = setTimeout(() => loadMembers(), memberSearch ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadMembers]);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [memberSearch, companyFilter, tagFilter, limit]);

  useEffect(() => { setSelected(new Set()); }, [page]);

  // Close tag dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync indeterminate state on select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return;
    const allSelected = members.length > 0 && members.every(m => selected.has(m.contactId));
    const someSelected = members.some(m => selected.has(m.contactId));
    selectAllRef.current.checked = allSelected;
    selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [selected, members]);

  const toggleSelect = (contactId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(contactId) ? next.delete(contactId) : next.add(contactId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = members.every(m => selected.has(m.contactId));
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); members.forEach(m => next.delete(m.contactId)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); members.forEach(m => next.add(m.contactId)); return next; });
    }
  };

  const confirmBatchRemove = () => {
    const count = selected.size;
    setModal({
      open: true,
      title: 'Remover contactos',
      message: `¿Remover ${count} contacto${count !== 1 ? 's' : ''} de esta lista? Los contactos no serán eliminados.`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        setBatchRemoving(true);
        try {
          await contactListsApi.batchRemoveContacts(id!, Array.from(selected));
          toast.success(`${count} contacto${count !== 1 ? 's' : ''} removido${count !== 1 ? 's' : ''}`);
          setSelected(new Set());
          loadList();
          loadMeta();
          loadMembers();
        } catch {
          toast.error('Error al remover contactos');
        } finally {
          setBatchRemoving(false);
        }
      },
    });
  };

  useEffect(() => {
    if (!showAddModal) return;
    const t = setTimeout(async () => {
      try {
        const data = await contactsApi.getAll({ search: searchContacts || undefined, limit: 50, page: addContactsPage });
        const memberIds = new Set(members.map(m => m.contactId));
        setAvailableContacts(data.contacts.filter((c: Contact) => !memberIds.has(c.id)));
        setAddContactsTotal(data.pagination?.total || 0);
      } catch {
        toast.error('Error al cargar contactos');
      }
    }, searchContacts ? 400 : 0);
    return () => clearTimeout(t);
  }, [showAddModal, searchContacts, members, addContactsPage]);

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedContacts(new Set());
    setSearchContacts('');
    setAddContactsPage(1);
  };

  const handleAddContacts = async () => {
    if (selectedContacts.size === 0) { toast.error('Selecciona al menos un contacto'); return; }
    setAdding(true);
    try {
      const result = await contactListsApi.addContacts(id!, Array.from(selectedContacts));
      toast.success(`${result.added} contacto(s) agregado(s)`);
      closeAddModal();
      loadList();
      loadMeta();
      loadMembers();
    } catch {
      toast.error('Error al agregar contactos');
    } finally {
      setAdding(false);
    }
  };

  const confirmRemove = (contactId: string, name: string) => {
    setModal({
      open: true,
      title: 'Remover contacto',
      message: `¿Remover a "${name}" de esta lista?`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await contactListsApi.removeContact(id!, contactId);
          toast.success('Contacto removido');
          loadList();
          loadMeta();
          loadMembers();
        } catch {
          toast.error('Error al remover contacto');
        }
      },
    });
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      next.has(contactId) ? next.delete(contactId) : next.add(contactId);
      return next;
    });
  };

  const toggleTagFilter = (tag: string) => {
    setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const hasFilters = memberSearch || companyFilter || tagFilter.length > 0;

  const clearFilters = () => {
    setMemberSearch('');
    setCompanyFilter('');
    setTagFilter([]);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mostrar:</span>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 focus:border-transparent">
            {LIMIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          {pages.map((p, i) => p === '...'
            ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
            : <button key={p} onClick={() => setPage(p as number)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${page === p ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                {p}
              </button>
          )}
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {total} contacto{total !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!list) return null;

  const selectedCount = selected.size;

  return (
    <>
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(MODAL_CLOSED)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{modal.title}</h3>
                <p className="text-sm text-gray-600">{modal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModal(MODAL_CLOSED)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={modal.onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Sí, remover</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <button onClick={() => navigate('/contact-lists')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Volver a listas
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <List className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 truncate">{list.name}</h1>
                  {list.description && <p className="text-sm text-gray-500 mt-0.5">{list.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{list._count?.members || 0} contacto{(list._count?.members || 0) !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0">
                <UserPlus size={15} />
                Agregar contactos
              </button>
            </div>
          </div>

          {/* Members table */}
          <div className="bg-white rounded-xl border border-gray-200">
            {!membersLoading && members.length === 0 && !hasFilters ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Sin contactos en esta lista</h3>
                <p className="text-sm text-gray-500 mb-4">Agrega contactos para empezar a usar esta lista.</p>
                <button onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <UserPlus size={15} />Agregar contactos
                </button>
              </div>
            ) : (
              <>
                {/* Filters bar */}
                <div className="p-4 border-b border-gray-100 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)}
                        placeholder="Buscar en esta lista..."
                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                      {memberSearch && (
                        <button onClick={() => setMemberSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Company filter */}
                    {metaCompanies.length > 0 && (
                      <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        <option value="">Todas las empresas</option>
                        {metaCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}

                    {/* Tag filter dropdown */}
                    {metaTags.length > 0 && (
                      <div className="relative" ref={tagDropdownRef}>
                        <button
                          onClick={() => setShowTagDropdown(v => !v)}
                          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm transition-colors ${tagFilter.length > 0 ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                          <Tag size={14} />
                          {tagFilter.length > 0 ? `${tagFilter.length} etiqueta${tagFilter.length !== 1 ? 's' : ''}` : 'Etiquetas'}
                          <ChevronDown size={14} />
                        </button>
                        {showTagDropdown && (
                          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[180px] max-h-52 overflow-y-auto">
                            {metaTags.map(tag => (
                              <label key={tag} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                                <input type="checkbox" checked={tagFilter.includes(tag)} onChange={() => toggleTagFilter(tag)}
                                  className="accent-orange-600 w-3.5 h-3.5" />
                                <span className="text-gray-700">{tag}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clear filters */}
                    {hasFilters && (
                      <button onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Filter size={14} />
                        Limpiar
                      </button>
                    )}
                  </div>

                  {hasFilters && !membersLoading && (
                    <p className="text-xs text-gray-400">{total} resultado{total !== 1 ? 's' : ''}</p>
                  )}
                </div>

                {/* Batch action bar */}
                {selectedCount > 0 && (
                  <div className="flex items-center justify-between bg-orange-50 border-b border-orange-200 px-4 py-3">
                    <span className="text-sm font-medium text-orange-800">{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(new Set())}
                        className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-white border border-orange-300 rounded-lg hover:bg-orange-50">
                        Deseleccionar
                      </button>
                      <button onClick={confirmBatchRemove} disabled={batchRemoving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg">
                        <Trash2 size={13} />
                        Remover de lista
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  {membersLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <input type="checkbox" ref={selectAllRef} onChange={toggleSelectAll}
                              className="accent-orange-600 w-4 h-4 cursor-pointer" />
                          </th>
                          {['Contacto', 'Email', 'Empresa', 'Teléfono', 'Etiquetas', 'Agregado', ''].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {members.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-400">
                              No se encontraron contactos con los filtros aplicados
                            </td>
                          </tr>
                        ) : members.map(member => (
                          <tr key={member.id}
                            className={`hover:bg-gray-50 transition-colors ${selected.has(member.contactId) ? 'bg-orange-50' : ''}`}>
                            <td className="px-4 py-4">
                              <input type="checkbox" checked={selected.has(member.contactId)}
                                onChange={() => toggleSelect(member.contactId)}
                                className="accent-orange-600 w-4 h-4 cursor-pointer" />
                            </td>
                            <td className="px-4 py-4 font-medium text-gray-900 text-sm whitespace-nowrap">
                              {member.contact.name || <span className="text-gray-400 italic">Sin nombre</span>}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{member.contact.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-500">{member.contact.company || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-500">{member.contact.phone || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {member.contact.tags?.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {member.contact.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-700 text-xs px-1.5 py-0.5 rounded border border-orange-100">
                                      <Tag size={10} />{tag}
                                    </span>
                                  ))}
                                  {member.contact.tags.length > 3 && (
                                    <span className="text-xs text-gray-400">+{member.contact.tags.length - 3}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-300 italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {format(new Date(member.addedAt), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => confirmRemove(member.contactId, member.contact.name || member.contact.email)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Contacts Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeAddModal} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Agregar contactos</h3>
              <button onClick={closeAddModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" value={searchContacts} onChange={e => { setSearchContacts(e.target.value); setAddContactsPage(1); }}
                  placeholder="Buscar contactos..."
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                {searchContacts && (
                  <button onClick={() => setSearchContacts('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {availableContacts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay contactos disponibles para agregar</p>
              ) : (
                <div className="space-y-1.5">
                  {availableContacts.map(contact => (
                    <label key={contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={selectedContacts.has(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="accent-orange-600 w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{contact.name || contact.email}</p>
                        {contact.name && <p className="text-xs text-gray-500 truncate">{contact.email}</p>}
                        {contact.company && <p className="text-xs text-gray-400 truncate">{contact.company}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Add modal pagination */}
            {addContactsTotal > 50 && (
              <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100">
                <button onClick={() => setAddContactsPage(p => Math.max(1, p - 1))} disabled={addContactsPage === 1}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-500">Página {addContactsPage}</span>
                <button onClick={() => setAddContactsPage(p => p + 1)} disabled={availableContacts.length < 50}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-5 border-t border-gray-200 gap-3">
              {selectedContacts.size > 0 && (
                <p className="text-xs text-orange-600 font-medium">{selectedContacts.size} seleccionado(s)</p>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={closeAddModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={handleAddContacts} disabled={adding || selectedContacts.size === 0}
                  className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition-colors">
                  {adding ? 'Agregando...' : `Agregar${selectedContacts.size > 0 ? ` (${selectedContacts.size})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
