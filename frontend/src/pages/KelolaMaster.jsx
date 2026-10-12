import { useState, useEffect, useRef } from 'react'
import { Plus, X, Save, Tag, Activity, ToggleLeft, Pencil, Check, RotateCcw } from 'lucide-react'
import { masterDataAPI } from '../utils/api'
import { useToast } from '../components/ToastContext'

function KelolaMaster() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')

  // Current (editable) state
  const [categories, setCategories] = useState([])
  const [conditions, setConditions] = useState([])
  const [statuses, setStatuses] = useState([])

  // Original (saved) state — for dirty checking
  const [origCategories, setOrigCategories] = useState([])
  const [origConditions, setOrigConditions] = useState([])
  const [origStatuses, setOrigStatuses] = useState([])

  // New item inputs
  const [newItem, setNewItem] = useState({ categories: '', conditions: '', statuses: '' })

  // Editing state: { sectionKey: index } or null
  const [editingItem, setEditingItem] = useState(null)
  const [editValue, setEditValue] = useState('')
  const editRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  // Focus input when editing
  useEffect(() => {
    if (editRef.current) editRef.current.focus()
  }, [editingItem])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await masterDataAPI.getAll()
      if (res.success) {
        const cats = res.data.categories || []
        const conds = res.data.conditions || []
        const stats = res.data.statuses || []
        setCategories([...cats])
        setConditions([...conds])
        setStatuses([...stats])
        setOrigCategories([...cats])
        setOrigConditions([...conds])
        setOrigStatuses([...stats])
      }
    } catch (err) { toast.error('Gagal memuat data: ' + err.message) }
    finally { setLoading(false) }
  }

  // Check if a section has unsaved changes
  const isDirty = (key) => {
    const current = key === 'categories' ? categories : key === 'conditions' ? conditions : statuses
    const original = key === 'categories' ? origCategories : key === 'conditions' ? origConditions : origStatuses
    if (current.length !== original.length) return true
    return current.some((item, i) => item !== original[i])
  }

  // Add item
  const addItem = (type) => {
    const val = newItem[type].trim().toUpperCase().replace(/\s+/g, '_')
    if (!val) return
    const getter = type === 'categories' ? categories : type === 'conditions' ? conditions : statuses
    // For categories, keep original casing
    const finalVal = type === 'categories' ? newItem[type].trim() : val
    if (getter.some(item => item.toUpperCase() === finalVal.toUpperCase())) {
      toast.error('Item sudah ada')
      return
    }
    const setter = type === 'categories' ? setCategories : type === 'conditions' ? setConditions : setStatuses
    setter([...getter, finalVal])
    setNewItem(p => ({ ...p, [type]: '' }))
  }

  // Remove item
  const removeItem = (type, index) => {
    const getter = type === 'categories' ? [...categories] : type === 'conditions' ? [...conditions] : [...statuses]
    if (getter.length <= 1) { toast.error('Minimal harus ada 1 item'); return }
    const setter = type === 'categories' ? setCategories : type === 'conditions' ? setConditions : setStatuses
    getter.splice(index, 1)
    setter(getter)
    // Cancel editing if the edited item is removed
    if (editingItem?.key === type && editingItem?.index === index) {
      setEditingItem(null)
    }
  }

  // Start editing
  const startEdit = (key, index) => {
    const data = key === 'categories' ? categories : key === 'conditions' ? conditions : statuses
    setEditingItem({ key, index })
    setEditValue(data[index])
  }

  // Confirm edit
  const confirmEdit = () => {
    if (!editingItem) return
    const val = editValue.trim()
    if (!val) { toast.error('Nama tidak boleh kosong'); return }
    const { key, index } = editingItem
    // For conditions/statuses, uppercase with underscores
    const finalVal = key === 'categories' ? val : val.toUpperCase().replace(/\s+/g, '_')
    const getter = key === 'categories' ? [...categories] : key === 'conditions' ? [...conditions] : [...statuses]
    // Check duplicate (excluding current item)
    if (getter.some((item, i) => i !== index && item.toUpperCase() === finalVal.toUpperCase())) {
      toast.error('Item sudah ada')
      return
    }
    getter[index] = finalVal
    const setter = key === 'categories' ? setCategories : key === 'conditions' ? setConditions : setStatuses
    setter(getter)
    setEditingItem(null)
    setEditValue('')
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditingItem(null)
    setEditValue('')
  }

  // Discard changes for a section
  const discardChanges = (key) => {
    const origSetter = key === 'categories' ? origCategories : key === 'conditions' ? origConditions : origStatuses
    const setter = key === 'categories' ? setCategories : key === 'conditions' ? setConditions : setStatuses
    setter([...origSetter])
    setEditingItem(null)
  }

  // Save to API
  const saveItems = async (type) => {
    setSaving(type)
    try {
      const items = type === 'categories' ? categories : type === 'conditions' ? conditions : statuses
      const fn = type === 'categories' ? masterDataAPI.updateCategories : type === 'conditions' ? masterDataAPI.updateConditions : masterDataAPI.updateStatuses
      const res = await fn(items)
      if (res.success) {
        toast.success(res.message || 'Berhasil disimpan!')
        // Update originals after successful save
        const origSetter = type === 'categories' ? setOrigCategories : type === 'conditions' ? setOrigConditions : setOrigStatuses
        origSetter([...items])
      }
    } catch (err) { toast.error('Gagal menyimpan: ' + err.message) }
    finally { setSaving('') }
  }

  const label = (s) => s?.replace(/_/g, ' ') || s

  const sections = [
    { key: 'categories', title: 'Kategori Aset', desc: 'Daftar kategori untuk klasifikasi aset', icon: Tag, color: '#7355d8', bg: '#eee9ff', data: categories },
    { key: 'conditions', title: 'Kondisi Aset', desc: 'Daftar kondisi fisik aset', icon: Activity, color: '#d79b32', bg: '#fff4dd', data: conditions },
    { key: 'statuses', title: 'Status Aset', desc: 'Daftar status ketersediaan aset', icon: ToggleLeft, color: '#35a483', bg: '#e4f6f0', data: statuses },
  ]

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Memuat data master...</div>
  }

  return (
    <div className="asset-page">
      <div className="asset-page-header">
        <div>
          <h1>Manajemen Master Data</h1>
          <p>Kelola kategori, kondisi, dan status aset. Klik item untuk mengedit nama.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {sections.map(sec => {
          const dirty = isDirty(sec.key)
          return (
            <div key={sec.key} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: sec.bg, color: sec.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <sec.icon size={20} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px' }}>{sec.title}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{sec.desc}</p>
                  </div>
                </div>

                {/* Buttons: only show when dirty */}
                {dirty && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => discardChanges(sec.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px',
                        border: '1px solid #eee', borderRadius: '8px', background: '#f8f8fa',
                        color: '#777', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#ffe9e7'; e.currentTarget.style.color = '#df625d' }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#f8f8fa'; e.currentTarget.style.color = '#777' }}
                    >
                      <RotateCcw size={13} />
                      <span>Batal</span>
                    </button>
                    <button
                      onClick={() => saveItems(sec.key)}
                      disabled={saving === sec.key}
                      className="add-asset-button"
                      style={{ gap: '6px' }}
                    >
                      <Save size={14} />
                      <span>{saving === sec.key ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                {/* Add form */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={newItem[sec.key]}
                    onChange={(e) => setNewItem(p => ({ ...p, [sec.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(sec.key)}
                    placeholder={`Tambah ${sec.title.toLowerCase()} baru...`}
                    style={{
                      flex: 1, height: '38px', padding: '0 12px', border: '1px solid #eee',
                      borderRadius: '8px', fontSize: '12px', outline: 'none', background: '#f8f8fa',
                    }}
                  />
                  <button
                    onClick={() => addItem(sec.key)}
                    style={{
                      height: '38px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #eee', borderRadius: '8px', background: sec.bg, color: sec.color,
                      cursor: 'pointer', flexShrink: 0, transition: '0.2s',
                    }}
                    title="Tambah"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Items list */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {sec.data.map((item, idx) => {
                    const isEditing = editingItem?.key === sec.key && editingItem?.index === idx
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: isEditing ? '4px 6px' : '8px 12px',
                          background: isEditing ? '#fff' : '#f8f8fa',
                          border: isEditing ? `2px solid ${sec.color}` : '1px solid #eee',
                          borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: '#444',
                          transition: '0.15s',
                        }}
                      >
                        {isEditing ? (
                          <>
                            <input
                              ref={editRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmEdit()
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              style={{
                                width: `${Math.max(editValue.length * 7.5, 60)}px`,
                                border: 'none', outline: 'none', fontSize: '12px', fontWeight: 500,
                                background: 'transparent', color: '#333', padding: '4px 2px',
                              }}
                            />
                            <button
                              onClick={confirmEdit}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '22px', height: '22px', border: 'none', borderRadius: '4px',
                                background: sec.bg, color: sec.color, cursor: 'pointer', padding: 0,
                              }}
                              title="Konfirmasi"
                            >
                              <Check size={12} strokeWidth={3} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '22px', height: '22px', border: 'none', borderRadius: '4px',
                                background: '#f5f5f7', color: '#999', cursor: 'pointer', padding: 0,
                              }}
                              title="Batal"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              onClick={() => startEdit(sec.key, idx)}
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                              title="Klik untuk edit"
                            >
                              {label(item)}
                            </span>
                            <button
                              onClick={() => startEdit(sec.key, idx)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '18px', height: '18px', border: 'none', borderRadius: '4px',
                                background: 'transparent', color: '#ccc', cursor: 'pointer', padding: 0,
                                transition: '0.2s',
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = sec.bg; e.currentTarget.style.color = sec.color }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc' }}
                              title="Edit"
                            >
                              <Pencil size={10} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => removeItem(sec.key, idx)}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '18px', height: '18px', border: 'none', borderRadius: '4px',
                                background: 'transparent', color: '#ccc', cursor: 'pointer', padding: 0,
                                transition: '0.2s',
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#ffe9e7'; e.currentTarget.style.color = '#df625d' }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc' }}
                              title="Hapus"
                            >
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#aaa' }}>
                  <span>Total: {sec.data.length} item</span>
                  {dirty && <span style={{ color: sec.color, fontWeight: 600 }}>• Ada perubahan belum disimpan</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default KelolaMaster
