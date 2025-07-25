import { Button } from "@/components/ui/button";
import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="absolute inset-x-0 top-0 flex h-full w-full items-center justify-center opacity-100">
        <Image
          alt="background"
          src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/patterns/square-alt-grid.svg"
          className="[mask-image:radial-gradient(75%_75%_at_center,white,transparent)] opacity-90"
          fill
          priority
        />
      </div>
      <div className="relative z-10 container mx-auto">
        <div className="mx-auto flex max-w-5xl flex-col items-center">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="rounded-xl bg-background/30 p-4 shadow-sm backdrop-blur-sm">
              <Image
                src="/wt-icon-dark.png"
                alt="logo"
                width={64}
                height={64}
                className="h-16 w-auto"
              />
            </div>
            <div>
              <h1 className="mb-6 text-2xl font-bold tracking-tight text-pretty lg:text-5xl">
                Lacak pekerjaan karyawan Anda dengan{" "}
                <span className="text-primary">Work Tracker</span>
              </h1>
              <p className="mx-auto max-w-3xl text-muted-foreground lg:text-xl">
                Work Tracker adalah solusi komprehensif yang dirancang untuk membantu Anda
                memantau dan mengelola tugas karyawan secara efisien. Lacak pekerjaan
                karyawan dengan sistem persetujuan dan bukti untuk memastikan produktivitas
                dan akuntabilitas.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button className="shadow-sm transition-shadow hover:shadow">
                <a href="/login">Login</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero };
