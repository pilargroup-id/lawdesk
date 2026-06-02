import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { XClose } from '../template/TemplateIcons.jsx'
import TimeLineMT from '../timeline/TimeLineMT.jsx'
import { getDeveloperProjects } from '../../services/reports/DeveloperReports.js'

function DialogTimelinePrjPerf({
  isOpen = false,
  developerId = null,
  year = '2026',
  status = 'all',
  eyebrow = 'Dialog',
  title = 'Timeline',
  onClose,
}) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !developerId) {
      setItems([])
      return
    }

    async function fetchTimeline() {
      console.log('Fetching timeline for developerId:', developerId)
      setIsLoading(true)
      try {
        const response = await getDeveloperProjects(developerId, { year, status })
        console.log('API Response:', response)
        
        // Group tasks by project
        const projectsTimeline = response.data.map(prj => {
          const formatStatus = (s) => {
            if (!s) return 'Unknown'
            return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          }

          const projectItems = []
          if (prj.tasks && prj.tasks.length > 0) {
            prj.tasks.forEach(task => {
              projectItems.push({
                id: `task-${task.id}`,
                status: formatStatus(task.status || prj.status),
                timestamp: task.progress_date,
                title: prj.project_name,
                detail: task.description || `Progress: ${task.progress_percent}%`
              })
            })
          } else {
            projectItems.push({
              id: `prj-${prj.project_id}`,
              status: formatStatus(prj.status),
              timestamp: prj.last_progress_date || prj.end_date || prj.start_date,
              title: prj.project_name,
              detail: `Progress: ${prj.progress_percent}% - ${prj.tasks_count} Tasks (No detailed activity)`
            })
          }

          // Sort tasks within the project descending
          projectItems.sort((a, b) => {
            const dateA = new Date(a.timestamp)
            const dateB = new Date(b.timestamp)
            return dateB - dateA
          })
          
          return {
            projectId: prj.project_id,
            projectName: prj.project_name,
            latestTimestamp: projectItems.length > 0 ? projectItems[0].timestamp : null,
            items: projectItems
          }
        })

        // Sort projects by their latest task timestamp descending
        projectsTimeline.sort((a, b) => {
          const dateA = new Date(a.latestTimestamp)
          const dateB = new Date(b.latestTimestamp)
          return dateB - dateA
        })

        setItems(projectsTimeline)
      } catch (error) {
        console.error('Failed to fetch developer projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [isOpen, developerId, year, status])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  if (typeof document === 'undefined') {
    return null
  }

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup mtickets-timeline-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-timeline-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id="dialog-timeline-title">
              {title}
            </h2>
          </div>

          <button
            type="button"
            className="dashboard-popup__close"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body mtickets-timeline-popup__body" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {items.length === 0 ? (
            <p className="mtickets-timeline__empty">
              {isLoading ? 'Memuat data timeline...' : 'Belum ada data project untuk developer ini.'}
            </p>
          ) : (
            items.map((project) => (
              <div key={project.projectId} className="project-timeline-group">
                <div style={{
                  marginBottom: '1.25rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '24px',
                    backgroundColor: 'var(--color-primary-main, #3b82f6)',
                    borderRadius: '4px'
                  }}></div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: 'var(--color-text-main, #111827)',
                    margin: 0
                  }}>
                    {project.projectName}
                  </h3>
                </div>
                <TimeLineMT 
                  items={project.items} 
                  emptyMessage="Belum ada riwayat aktivitas untuk project ini."
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogTimelinePrjPerf
