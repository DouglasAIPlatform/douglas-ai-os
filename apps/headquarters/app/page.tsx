import { redirect } from "next/navigation";
import { routeById } from "@/config/routes";

export default function Home() {
  redirect(routeById.headquarters.path);
}
