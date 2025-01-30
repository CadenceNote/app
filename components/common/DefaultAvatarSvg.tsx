
// Create a component that exports both the avatar component and the base64 string
export const defaultAvatarSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="#e2e8f0"/>
    <circle cx="50" cy="40" r="20" fill="#94a3b8"/>
    <path d="M50 65 C20 65 15 95 15 100 L85 100 C85 95 80 65 50 65Z" fill="#94a3b8"/>
</svg>`;

// Convert to base64
export const defaultAvatarBase64 = `data:image/svg+xml;base64,${Buffer.from(defaultAvatarSvg).toString('base64')}`;

// Export default url that can be used as a fallback
export const defaultAvatarUrl = defaultAvatarBase64;