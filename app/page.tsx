"use client"

import { useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Layout from "@/components/Layout"
import { ArrowRight, Calendar, Users, Zap, MousePointer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser } from "@/hooks/useUser"

const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-indigo-500 animate-gradient" />
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
)

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`relative overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl`}
  >
    <div className={`absolute inset-0 opacity-10 bg-${color}-500`} />
    <div className="relative p-6">
      <Icon className={`h-12 w-12 text-${color}-500 mb-4`} />
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </motion.div>
)

const AnimatedText = ({ children }) => (
  <motion.span
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="inline-block"
  >
    {children}
  </motion.span>
)

const FloatingIcons = () => {
  const iconPositions = [
    { top: "20%", left: "15%" },
    { top: "40%", left: "75%" },
    { top: "70%", left: "25%" },
    { top: "30%", left: "60%" }
  ]

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[Calendar, Users, Zap, MousePointer].map((Icon, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{
            top: iconPositions[index].top,
            left: iconPositions[index].left,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 5 + index,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <Icon className="h-8 w-8 text-gray-100/50" />
        </motion.div>
      ))}
    </div>
  )
}

export default function Home() {
  const { user, isLoading } = useUser()
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  return (
    <Layout>
      <div ref={containerRef} className="relative min-h-screen overflow-hidden bg-white">
        <AnimatedBackground />
        <FloatingIcons />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center"
          style={{ y: textY }}
        >
          <AnimatedText>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight text-gray-100">
              Revolutionize Your
              <br />
              <span className="bg-gradient-to-br from-red-300 to-orange-300 text-transparent bg-clip-text">
                Agile Workflows
              </span>
            </h1>
          </AnimatedText>

          <AnimatedText>
            <p className="text-xl md:text-2xl mb-12 max-w-2xl text-gray-100">
              Capture decisions, track actions, and streamline team workflow.
            </p>
          </AnimatedText>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {isLoading ? null : !user ? (
              <>
                <Button size="lg" variant="default" asChild>
                  <a href="/signup" className="group">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/login">Log in</a>
                </Button>
              </>
            ) : (
              <Button size="lg" variant="outline" asChild>
                <a href="/dashboard" className="group">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* Animated Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <ArrowRight className="h-8 w-8 text-gray-100 rotate-90" />
        </motion.div>
      </div>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Elevate Your Meetings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard
              icon={Calendar}
              title="Smart Templates"
              description="Pre-built templates for standups, retros, and planning sessions. Start taking notes instantly."
              color="blue"
            />
            <FeatureCard
              icon={Users}
              title="Real-time Collaboration"
              description="Work together with your team in real-time. Everyone stays in sync, automatically."
              color="indigo"
            />
            <FeatureCard
              icon={Zap}
              title="Action Tracking"
              description="Turn discussions into trackable action items. Never lose track of important tasks."
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">See It in Action</h2>
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                className="w-64 h-64 bg-white rounded-2xl shadow-lg flex items-center justify-center"
              >
                <MousePointer className="h-12 w-12 text-blue-500" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Alice Johnson",
                role: "Product Manager",
                content: "Agilee has transformed our sprint planning sessions. We're more efficient than ever!",
              },
              {
                name: "Bob Smith",
                role: "Scrum Master",
                content: "The real-time collaboration feature is a game-changer for our distributed team.",
              },
              {
                name: "Carol Williams",
                role: "Developer",
                content: "I love how easy it is to track action items and follow up on decisions made during meetings.",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 p-6 rounded-xl shadow-md"
              >
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full mr-4" />
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Ready to Transform Your Meetings?</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of teams already using Agilee to boost their productivity and collaboration.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/signup" className="group">
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      </section>

    </Layout>
  )
}

