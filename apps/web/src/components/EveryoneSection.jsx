'use client'

export default function EveryoneSection() {
  const groups = [
    {
      label: 'Franchise Kids',
      image: '/assets/kids.jpg',
    },
    {
      label: 'Franchise Youth',
      image: '/assets/youth.jpg',
    },
    {
      label: 'Franchise Adults',
      image: '/assets/Adults.jpg',
    },
  ]

  return (
    <section className="bg-[#ededed] py-20 px-4 text-center ">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bebas text-black tracking-wide">
          There’s a place <br /> <span className="text-gold">for everyone</span>
        </h2>
        <p className="text-sm text-gray-600 mt-2">Be a part of the movement</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-7xl mx-auto">
        {groups.map(({ label, image }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-xl group shadow-md"
          >
            <img
              src={image}
              alt={label}
              className="w-full h-72 object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute bottom-0 left-0 p-4 bg-black/60 w-full text-left">
              <p className="text-white font-semibold text-lg">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
