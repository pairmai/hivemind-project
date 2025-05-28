// import { redirect } from "next/navigation";

// export default async function LocalePage({ params }: { params: { locale: string } }) {
//   const { locale } = await params; // ใช้ params ที่ส่งมาโดยตรง
//   return redirect(`/${locale}/login`); // ใช้ locale ที่ถูกต้อง
// }
import { redirect } from "next/navigation";
 
export default async function LocalePage({ params }: { params: { locale: string } }) {
  const { locale } = await params; // ใช้ params ที่ส่งมาโดยตรง
  return redirect(`/${locale}/login`); // ใช้ locale ที่ถูกต้อง
}