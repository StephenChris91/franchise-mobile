// 'use client'

// import React from 'react'
// import { Share2 } from 'lucide-react'

// /**
//  * Expects a sermon object shaped like:
//  * {
//  *   title: string,
//  *   speaker: string,
//  *   date: string | Date,
//  *   thumbnail: string (signed URL or fallback),
//  *   audioUrl: string (signed URL to audio in Supabase)
//  * }
//  */
// export default function SermonCard({ sermon, onPlay }) {
//   const safeDate = sermon?.date ? new Date(sermon.date) : null
//   const prettyDate = safeDate
//     ? safeDate.toLocaleDateString()
//     : ''

//   // Build a download filename and link that forces download from Supabase signed URL
//   const downloadFileName =
//     `${sermon?.title || 'sermon'} - ${sermon?.speaker || 'Franchise Church'}${prettyDate ? ` (${prettyDate})` : ''}.mp3`
//       .replace(/\//g, '-')

//   const downloadUrl = sermon?.audioUrl
//     ? `${sermon.audioUrl}${sermon.audioUrl.includes('?') ? '&' : '?'}download=${encodeURIComponent(downloadFileName)}`
//     : undefined

//   const shareText = [
//     sermon?.title ? `“${sermon.title}”` : null,
//     sermon?.speaker ? `by ${sermon.speaker}` : null,
//     prettyDate ? `(${prettyDate})` : null,
//   ].filter(Boolean).join(' ')

//   const handleShare = async () => {
//     if (!downloadUrl) return
//     const shareData = {
//       title: sermon?.title || 'Franchise Church Sermon',
//       text: shareText || 'Sermon from Franchise Church',
//       url: downloadUrl,
//     }
//     try {
//       if (navigator.share) {
//         await navigator.share(shareData)
//       } else {
//         await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
//         alert('Sharable download link copied to clipboard.')
//       }
//     } catch {
//       try {
//         await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
//         alert('Sharable download link copied to clipboard.')
//       } catch {}
//     }
//   }

//   return (
//     <article className="bg-white rounded-lg shadow overflow-hidden">
//       <img
//         src={sermon.thumbnail || '/assets/sermon-fallback.jpg'}
//         alt={sermon.title}
//         className="w-full h-56 object-cover"
//       />
//       <div className="p-4 space-y-2">
//         <h3 className="text-lg font-semibold text-gray-800">{sermon.title}</h3>
//         <p className="text-sm text-gray-600">
//           {sermon.speaker} {prettyDate ? `• ${prettyDate}` : ''}
//         </p>

//         <div className="flex items-center justify-between pt-2">
//           <button
//             onClick={() => onPlay(sermon)}
//             className="px-4 py-2 text-sm rounded-md bg-black text-white hover:bg-gray-800 transition cursor-pointer"
//           >
//             Play
//           </button>

//           <button
//             type="button"
//             onClick={handleShare}
//             title="Share downloadable link"
//             className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border hover:bg-gray-50 transition cursor-pointer"
//             disabled={!downloadUrl}
//           >
//             <Share2 className="w-4 h-4" />
//             Share
//           </button>
//         </div>
//       </div>
//     </article>
//   )
// }



// components/sermons/SermonsCard.jsx - CORRECTED
export default function SermonCard({ sermon, onPlay }) {
  const [durationText, setDurationText] = useState('')

  useEffect(() => {
    if (sermon.duration) {
      const totalSeconds = Math.floor(sermon.duration)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      setDurationText(`${hours}Hr ${minutes} Mins`)
    }
  }, [sermon.duration])

  const handlePlay = () => {
    onPlay(sermon)
  }

  const handleDownload = (e) => {
    e.stopPropagation()
    
    // ✅ Use the backend-provided shareUrl
    if (sermon.shareUrl || sermon.audioUrl) {
      window.open(sermon.shareUrl || sermon.audioUrl, '_blank')
    } else {
      console.error('No download URL available')
    }
  }

  return (
    <div onClick={handlePlay} className="bg-white rounded-md shadow hover:shadow-lg transition duration-300 cursor-pointer">
      <div className="relative">
        {/* ✅ Use thumbnailUrl from backend */}
        <img
          src={sermon.thumbnailUrl || '/assets/sermon-fallback.jpg'}
          alt={sermon.title}
          className="w-full h-64 object-cover rounded-t-md"
          onError={(e) => {
            e.target.src = '/assets/sermon-fallback.jpg'
          }}
        />
        {durationText && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
            {durationText}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold leading-tight text-black">
          {sermon.title}
        </h3>
        <p className="text-xs text-gray-600">
          {sermon.speaker || 'Franchise Church'}
        </p>
        <div className='flex justify-between items-center mx-auto'>
          <p className="text-xs text-gray-500">
            {/* ✅ Format date properly */}
            {new Date(sermon.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 text-sm mt-2 text-black bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md"
          >
            <HiDownload className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}