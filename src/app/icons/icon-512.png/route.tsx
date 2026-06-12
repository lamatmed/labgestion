import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          borderRadius: 112,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {/* Neck */}
          <div style={{
            width: 96, height: 120,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px 12px 0 0',
          }} />
          {/* Shoulders */}
          <div style={{
            width: 268, height: 24,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 8,
          }} />
          {/* Body */}
          <div style={{
            width: 268, height: 140,
            background: 'rgba(255,255,255,0.95)',
            clipPath: 'polygon(0 0, 100% 0, 118% 100%, -18% 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden',
          }}>
            {/* Liquid */}
            <div style={{
              width: '100%', height: 80,
              background: '#60a5fa',
              opacity: 0.85,
            }} />
          </div>
          {/* Medical cross */}
          <div style={{
            position: 'absolute',
            top: -8, right: -100,
          }}>
            <div style={{ position: 'absolute', width: 20, height: 60, background: 'rgba(255,255,255,0.9)', borderRadius: 10, left: 20, top: 0 }} />
            <div style={{ position: 'absolute', width: 60, height: 20, background: 'rgba(255,255,255,0.9)', borderRadius: 10, left: 0, top: 20 }} />
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  )
}
