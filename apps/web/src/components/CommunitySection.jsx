'use client'

export default function CommunitySection() {
  const community = [
    {
      title: 'Membership Class',
      image: '/assets/membership.jpg',
      description:
        'Our Membership Classes are designed to welcome you into our family and get you started in your growth journey.',
    },
    {
      title: 'Care Network',
      image: '/assets/care.jpg',
      description:
        'Through our care network, we provide support for life situations, helping you thrive spiritually and emotionally.',
    },
    {
      title: 'Counseling',
      image: '/assets/counseling.jpg',
      description:
        'Need a chat? There’s always someone ready to listen, pray with you, and provide spiritual support.',
    },
  ]

  return (
    <section className="bg-[#ededed] py-20 px-4 text-center">
      <div className="mb-12">
        <span className="text-xs font-semibold uppercase text-gray-500 tracking-widest">
          At Franchise Church
        </span>
        <h2 className="mt-2 text-3xl md:text-4xl font-bebas text-black tracking-wide">
          We do community differently <br />
          <span className="text-gold">at Franchise Church</span>
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          More than a church, we’re a people.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
        {community.map(({ title, image, description }) => (
          <div
            key={title}
            className="rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <img
              src={image}
              alt={title}
              className="w-full h-56 object-cover"
            />
            <div className="bg-white p-6 text-left">
              <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
