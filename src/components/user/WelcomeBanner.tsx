interface WelcomeBannerProps {
  firstName: string
}

export function WelcomeBanner({ firstName }: WelcomeBannerProps) {
  return (
    <div className="ancient-card-dark overflow-hidden min-h-[200px] relative">
      <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: "url('/bg/hero-banner.jpg')" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(10,30,18,0.95)] via-[rgba(10,30,18,0.7)] to-transparent" />

      <div className="p-5 md:p-8 relative z-[2]">
        <div className="mb-6">
          <p className="text-[11px] tracking-[0.15em] font-bold mb-1 uppercase" style={{ color: '#C8960C' }}>
            ❖ &nbsp;NAMASTE&nbsp; ❖
          </p>
          <h2 className="text-[clamp(26px,4.5vw,36px)] font-black m-0 leading-[1.15]" style={{ color: '#E8D5B0' }}>
            {firstName}
          </h2>
          <p className="italic text-[15px] mt-[6px]" style={{ color: 'rgba(220,185,120,0.9)' }}>
            — Keep growing everyday —
          </p>
        </div>

        <div className="w-12 h-[1px] mb-5" style={{ background: 'rgba(200,150,12,0.35)' }} />

        <h3 className="text-[clamp(18px,3vw,24px)] font-extrabold leading-[1.2] m-0" style={{ color: '#C8960C' }}>
          Learn. Grow. Achieve.
        </h3>
        <p className="text-sm italic mt-[6px]" style={{ color: 'rgba(220,185,120,0.6)' }}>
          Ancient wisdom for modern minds.
        </p>
      </div>
    </div>
  )
}
