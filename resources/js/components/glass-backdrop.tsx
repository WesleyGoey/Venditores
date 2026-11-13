/** Color behind glass surfaces. Radial gradients, not blur-3xl blobs: those render with a hard clipped edge in Safari. */
export default function GlassBackdrop() {
    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10"
            style={{
                backgroundImage:
                    'radial-gradient(48rem 36rem at 0% 0%, rgba(36,76,255,.38), transparent 70%), radial-gradient(40rem 32rem at 100% 40%, rgba(23,25,29,.16), transparent 70%), radial-gradient(44rem 30rem at 30% 100%, rgba(36,76,255,.22), transparent 70%)',
            }}
        />
    );
}
