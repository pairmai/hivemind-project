import { redirect } from "next/navigation";

export default async function HomePage({ params }: { params: { locale: string } }) {
  await redirect(`/${params.locale}/login`);
}