import { useEffect, useState } from 'react'
import DataTableMCategory from './DataTableMCategory.jsx'
import api from '../../../services/api.js'
import CreateButtonCategory from '../../../components/button/ButtonCreateCategory.jsx'
import DialogCreateCategory from '../../../components/dialog/DialogCreateCategory.jsx'
import DialogDelete from '../../../components/dialog/DialogDelete.jsx'
import { Edit03, Trash03 } from '../../../components/template/TemplateIcons.jsx'

function MasterCategory({ searchQuery = '' }) {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeActionDialog, setActiveActionDialog] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/user/category')
      setCategories(response.data || [])
    } catch (err) {
      setError(err.message || 'Gagal memuat kategori')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function initialFetch() {
      setIsLoading(true)
      try {
        const response = await api.get('/user/category')
        if (isMounted) {
          setCategories(response.data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat kategori')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialFetch()

    return () => {
      isMounted = false
    }
  }, [])

  const columns = [
    {
      key: 'id',
      header: 'ID',
      cellStyle: { width: '5%', whiteSpace: 'nowrap' },
      render: (row) => row.id,
    },
    {
      key: 'name',
      header: 'Category Name',
      render: (row) => row.name,
    },
  ]

  const actions = [
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit03,
      onClick: (row) => {
        setSelectedCategory(row)
        setActiveActionDialog('edit')
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash03,
      variant: 'danger',
      onClick: (row) => {
        setSelectedCategory(row)
        setActiveActionDialog('delete')
      },
    },
  ]

  const handleCreateCategory = async (data) => {
    setIsDialogOpen(false)
    
    const tempId = Date.now()
    setCategories((prev) => [...prev, { id: tempId, name: data.name }])

    try {
      await api.post('/user/category', data)
      const response = await api.get('/user/category')
      setCategories(response.data || [])
    } catch (err) {
      console.error('Failed to create category:', err)
      setError(err.message || 'Gagal menambahkan kategori')
      setCategories((prev) => prev.filter((c) => c.id !== tempId))
    }
  }

  const handleEditCategory = async (data) => {
    setActiveActionDialog(null)
    
    setCategories((prev) => 
      prev.map((c) => (c.id === selectedCategory.id ? { ...c, name: data.name } : c))
    )

    try {
      await api.put(`/user/category/${selectedCategory.id}`, data)
      fetchCategories()
    } catch (err) {
      console.error('Failed to edit category:', err)
      setError(err.message || 'Gagal mengubah kategori')
      fetchCategories()
    } finally {
      setSelectedCategory(null)
    }
  }

  const handleDeleteCategory = async () => {
    const categoryToDelete = selectedCategory
    setActiveActionDialog(null)
    
    setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))

    try {
      await api.delete(`/user/category/${categoryToDelete.id}`)
      fetchCategories()
    } catch (err) {
      console.error('Failed to delete category:', err)
      setError(err.message || 'Gagal menghapus kategori')
      fetchCategories()
    } finally {
      setSelectedCategory(null)
    }
  }

  const filteredCategories = categories.filter((category) => {
    if (!searchQuery) return true
    const lowerQuery = searchQuery.toLowerCase()
    return (
      category.name.toLowerCase().includes(lowerQuery) ||
      String(category.id).toLowerCase().includes(lowerQuery)
    )
  })

  return (
    <section className="dashboard-panel users-table-card">
      <div className="users-table-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="dashboard-panel__title">Master Category</h1>
        <CreateButtonCategory onClick={() => setIsDialogOpen(true)} variant="primary">
          Create Category
        </CreateButtonCategory>
      </div>
      <DataTableMCategory
        columns={columns}
        rows={filteredCategories}
        actions={actions}
        isLoading={isLoading}
        errorMessage={error}
        emptyMessage="Tidak ada data kategori."
      />
      <DialogCreateCategory
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleCreateCategory}
      />
      <DialogCreateCategory
        isOpen={activeActionDialog === 'edit'}
        eyebrow="Edit Data"
        title="Edit Category"
        confirmLabel="Simpan"
        initialName={selectedCategory?.name}
        onClose={() => {
          setActiveActionDialog(null)
          setSelectedCategory(null)
        }}
        onConfirm={handleEditCategory}
      />
      <DialogDelete
        isOpen={activeActionDialog === 'delete'}
        eyebrow="Delete Data"
        title="Delete Category"
        user={selectedCategory}
        onClose={() => {
          setActiveActionDialog(null)
          setSelectedCategory(null)
        }}
        onConfirm={handleDeleteCategory}
      />
    </section>
  )
}

export default MasterCategory
