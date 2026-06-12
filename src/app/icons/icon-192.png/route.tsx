import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          borderRadius: 40,
        }}
      >
        {/* Flask body */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {/* Neck */}
          <div style={{
            width: 36, height: 44,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '6px 6px 0 0',
            marginBottom: 0,
          }} />
          {/* Shoulders */}
          <div style={{
            width: 100, height: 12,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 4,
          }} />
          {/* Body trapezoid */}
          <div style={{
            width: 100, height: 56,
            background: 'rgba(255,255,255,0.95)',
            clipPath: 'polygon(0 0, 100% 0, 115% 100%, -15% 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            overflow: 'hidden',
          }}>
            {/* Liquid */}
            <div style={{
              width: '100%', height: 32,
              background: '#60a5fa',
              opacity: 0.85,
            }} />
          </div>
          {/* Medical cross */}
          <div style={{
            position: 'absolute',
            top: -4, right: -40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', width: 8, height: 24, background: 'rgba(255,255,255,0.9)', borderRadius: 4 }} />
            <div style={{ position: 'absolute', width: 24, height: 8, background: 'rgba(255,255,255,0.9)', borderRadius: 4 }} />
          </div>
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  )
}
