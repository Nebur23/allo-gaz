import L from "leaflet";

export function createOptimizedIcon(
  color: string,
  size: number = 40,
  icon?: string
): L.DivIcon {
  const iconHtml =
    icon ||
    `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  `;

  return L.divIcon({
    html: `
      <div class="w-${size / 4} h-${
      size / 4
    } bg-gradient-to-br ${color} rounded-full border-3 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer" style="width: ${size}px; height: ${size}px;">
        ${iconHtml}
      </div>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  }) as unknown as L.Icon;
}
