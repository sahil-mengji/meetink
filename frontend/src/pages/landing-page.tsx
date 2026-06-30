import { motion } from "motion/react"
import { ArrowRight, Sparkles, Mic, Activity, BrainCircuit, ShieldCheck, Database, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/env"

export function LandingPage() {
  const navigate = useNavigate()

  const FEATURES = [
    {
      icon: BrainCircuit,
      title: "Multi-Agent AI",
      description: "Dedicated AI agents specialize in extracting decisions, risks, goals, and action items with extreme precision."
    },
    {
      icon: Database,
      title: "Knowledge Graph",
      description: "We don't just store transcripts. We build a semantic knowledge graph of your entire organization's memory."
    },
    {
      icon: Activity,
      title: "Team Analytics",
      description: "Track participation metrics, talk-time balance, and cross-team dependencies in real-time."
    },
    {
      icon: ShieldCheck,
      title: "Full Traceability",
      description: "Every generated insight links directly back to the exact timestamp and quote in the raw transcript."
    }
  ]

  const STEPS = [
    { step: "01", title: "Capture", desc: "Upload audio, transcripts, or record live." },
    { step: "02", title: "Analyze", desc: "Our AI pipeline processes and diarizes the conversation." },
    { step: "03", title: "Extract", desc: "Agents pull structured data (risks, decisions, actions)." },
    { step: "04", title: "Act", desc: "Sync to Jira, Notion, or query the knowledge base." },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-6">
        {/* Subtle decorative grid background for premium tech aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Modern ambient glow behind content */}
        <div aria-hidden className="absolute z-0 inset-0 [background:radial-gradient(100%_100%_at_50%_35%,var(--color-blue-500)/0.08,transparent_60%)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 flex items-center gap-2 bg-muted/60 border border-border/80 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Introducing {APP_NAME} 2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 text-foreground"
          >
            Transform Your Meetings Into <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Actionable Knowledge</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
          >
            Stop losing institutional memory. Automatically capture, transcribe, and deeply analyze your team's conversations with our specialized multi-agent architecture.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-semibold rounded-full hover:scale-105 transition-transform bg-primary text-primary-foreground hover:bg-primary/95"
              onClick={() => navigate("/app")}
            >
              Enter Dashboard <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg font-semibold rounded-full hover:bg-muted/50 transition-colors"
            >
              <Mic className="mr-2 w-5 h-5" /> Live Demo
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 2. FEATURES SECTION */}
      <section className="py-24 px-6 bg-muted/30 border-y">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Beyond Simple Transcripts</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We don't just write down what you said. Our agentic workflow understands the context, dependencies, and implications of your meetings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-card border text-card-foreground shadow-sm rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Pipeline</h2>
            <p className="text-muted-foreground max-w-xl">From raw audio to structured intelligence in minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative"
              >
                {idx !== STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%-1rem)] w-[calc(100%-2rem)] h-[2px] bg-border" />
                )}
                <div className="text-5xl font-black text-muted/50 mb-4">{step.step}</div>
                <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CTA SECTION */}
      <section className="py-32 px-6 relative overflow-hidden flex justify-center items-center">
        {/* Ambient glow behind CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 w-full max-w-4xl mx-auto bg-card/30 backdrop-blur-2xl border border-primary/20 p-12 md:p-20 rounded-[3rem] text-center shadow-[0_0_80px_rgba(37,99,235,0.15)]"
        >
          <Zap className="w-16 h-16 mx-auto mb-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">Ready to upgrade <br />your workflow?</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">Join the leading teams using {APP_NAME} to eliminate meeting amnesia and drive projects forward with unprecedented clarity.</p>
          <Button
            size="lg"
            className="h-16 px-12 text-xl font-bold rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] hover:scale-110 transition-all duration-300"
            onClick={() => navigate("/app")}
          >
            Get Started For Free
          </Button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="pt-24 pb-12 px-6 border-t bg-background relative overflow-hidden">
        {/* Subtle grid in footer */}
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dzl9yxixg/image/upload/v1714558603/grid_tih1zq.svg')] bg-center opacity-[0.03] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-2xl tracking-tight">{APP_NAME}</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
              The AI-powered meeting intelligence platform designed specifically for modern product and engineering teams.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-foreground tracking-wide">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-foreground tracking-wide">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-foreground tracking-wide">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Security Hub</a></li>
            </ul>
          </div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME} Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <span className="hover:text-foreground cursor-pointer transition-colors">Twitter</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">GitHub</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">LinkedIn</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
