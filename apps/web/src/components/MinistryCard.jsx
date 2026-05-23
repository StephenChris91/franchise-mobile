import { motion } from 'framer-motion'

export default function MinistryCard({ icon, title, description }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-white rounded-xl shadow-md p-6 text-center border hover:border-gold transition"
    >
      <div className="flex justify-center mb-4">
        <img src={icon} alt={title} className="h-12 w-12 object-contain" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </motion.div>
  )
}
