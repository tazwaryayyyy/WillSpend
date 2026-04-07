"use client"

import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { AuroraBackground } from './ui/aurora-background'
import { HeroBadge } from './ui/hero-badge'
import { AnimatedShinyText } from './ui/animated-shiny-text'
import { MagneticButton } from './ui/magnetic-button'
import { ButtonColorful } from './ui/button-colorful'

export function HeroSection() {
    return (
        <section className="min-h-screen flex flex-col relative">
            <AuroraBackground />

            {/* Content positioned at bottom-left */}
            <div className="flex-1 flex items-end relative z-10 pb-24">
                <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
                    <motion.div
                        initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        transition={{
                            duration: 1.5,
                            bounce: 0.3,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="max-w-5xl"
                    >
                        {/* HeroBadge above headline */}
                        <motion.div
                            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                            transition={{
                                delay: 0.1,
                                duration: 1.5,
                                bounce: 0.3
                            }}
                            className="mb-8"
                        >
                            <HeroBadge>Financial Inaction Calculator</HeroBadge>
                        </motion.div>

                        {/* Main headline */}
                        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-thin tracking-tighter text-cream mb-8 leading-none break-words whitespace-normal">
                            <motion.span
                                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                transition={{
                                    delay: 0.2,
                                    duration: 1.5,
                                    bounce: 0.3
                                }}
                                className="block font-black"
                            >
                                You threw away
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                transition={{
                                    delay: 0.3,
                                    duration: 1.5,
                                    bounce: 0.3
                                }}
                                className="block font-black"
                            >
                                <span className="italic">thousands</span>
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                                transition={{
                                    delay: 0.4,
                                    duration: 1.5,
                                    bounce: 0.3
                                }}
                                className="block font-thin text-charcoal-600"
                            >
                                by doing nothing
                            </motion.span>
                        </h1>

                        {/* AnimatedShinyText for subheadline */}
                        <motion.div
                            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                            transition={{
                                delay: 0.5,
                                duration: 1.5,
                                bounce: 0.3
                            }}
                            className="mb-12"
                        >
                            <AnimatedShinyText className="text-xl md:text-2xl text-cream/80 max-w-2xl leading-relaxed">
                                Calculate the exact amount your passive financial decisions have quietly drained from your future — compounded over time.
                            </AnimatedShinyText>
                        </motion.div>

                        {/* MagneticButton wrapping ButtonColorful */}
                        <motion.div
                            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                            transition={{
                                delay: 0.6,
                                duration: 1.5,
                                bounce: 0.3
                            }}
                        >
                            <MagneticButton>
                                <ButtonColorful onClick={() => {
                                    document.getElementById('analysis-form')?.scrollIntoView({ behavior: 'smooth' })
                                }}>
                                    Start Analysis
                                    <ArrowDown className="w-5 h-5" />
                                </ButtonColorful>
                            </MagneticButton>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Stats bar */}
            <motion.div
                initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{
                    delay: 0.7,
                    duration: 1.5,
                    bounce: 0.3
                }}
                className="border-t border-charcoal-700 py-6 relative z-10"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12">
                    <div className="flex flex-wrap gap-6">
                        {[
                            { label: 'Users analyzed', value: '12,847' },
                            { label: 'Total losses found', value: '$89.2M' },
                            { label: 'Avg. recovery time', value: '8.3 months' },
                        ].map((stat, i) => (
                            <div key={stat.label} className="flex items-center gap-3">
                                <span className="text-xs font-mono uppercase tracking-wider text-cream/40">
                                    {stat.label}
                                </span>
                                <span className="text-sm font-display font-semibold text-cream">
                                    {stat.value}
                                </span>
                                {i < 2 && <span className="w-1 h-1 bg-charcoal-600 rounded-full ml-3" />}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </section>
    )
}