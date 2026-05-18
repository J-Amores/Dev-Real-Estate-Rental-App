import { PropertyCardManager } from "@/components/manager/property-card-manager";
import type { PropertyCardDTO } from "@/lib/manager-overview";

export function PropertyCardGrid({ properties }: { properties: PropertyCardDTO[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((p) => (
        <li key={p.id}>
          <PropertyCardManager property={p} />
        </li>
      ))}
    </ul>
  );
}
