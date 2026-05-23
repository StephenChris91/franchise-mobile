import CounsellingHeader from "@/components/counselling/CounsellingHeader";
import CounsellingForm from "@/components/counselling/CounsellingForm";

export default function CounsellingPage() {
  return (
    <section className="relative h-full bg-gray-100">
      <CounsellingHeader />

      {/* Floating Form */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="-mt-20 mb-24 bg-white p-8 rounded-xl z-10 relative">
          <CounsellingForm />
        </div>
      </div>
    </section>
  );
}
