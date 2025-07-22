interface Feature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

interface FeatureProps {
  heading?: string;
  features?: Feature[];
}
import Image from 'next/image'

const Feature = ({
 heading = "Cara yang lebih baik untuk melacak catatan kerja",
 features = [
   {
     id: "feature-1",
     title: "Manajemen Tugas Karyawan",
     subtitle: "UNTUK MANAGER",
     description:
       "Pantau dan lacak tugas karyawan dengan pembaruan waktu nyata. Tetapkan tugas, atur tenggat waktu, dan pastikan akuntabilitas dengan sistem manajemen tugas kami yang komprehensif.",
     image: "/task-list-home-icon.png",
   },
   {
     id: "feature-2",
     title: "Sistem Persetujuan & Bukti",
     subtitle: "UNTUK KARYAWAN",
     description:
       "Kirim bukti kerja dan dapatkan persetujuan dengan mudah. Unggah dokumen, gambar, dan pembaruan kemajuan untuk memvalidasi tugas yang selesai dan menjaga transparansi.",
     image: "/approval-home-icon.png",
   },
 ],
}: FeatureProps) => {
  return (
    <section className="py-32">
      <div className="container max-w-7xl mx-auto">
        <h2 className="text-3xl font-medium lg:text-4xl">{heading}</h2>
        <div className="mt-20 grid gap-9 lg:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex flex-col justify-between rounded-lg bg-accent"
            >
              <div className="flex justify-between gap-10 border-b">
                <div className="flex flex-col justify-between gap-14 py-6 pl-4 md:py-10 md:pl-8 lg:justify-normal">
                  <p className="text-xs text-muted-foreground">
                    {feature.subtitle}
                  </p>
                  <h3 className="text-2xl md:text-4xl">{feature.title}</h3>
                </div>
                <div className="w-32 md:w-40 shrink-0 rounded-r-lg border-l flex items-center justify-center p-4">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    width={125}
                    height={125}
                    loading="lazy"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="p-4 text-muted-foreground md:p-8">
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Feature };
