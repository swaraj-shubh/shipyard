import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Users, 
  Bot, 
  CheckCircle, 
  Sparkles,
  Rocket,
  Lock,
  Target,
  Globe,
  Clock,
  Award,
  TrendingUp,
  Fingerprint,
  Mail,
  Wallet,
  Calendar,
  FileText,
  Network,
  Eye
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.5 }
};

const pulseAnimation = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
import { useNavigate } from "react-router-dom";
export default function Home() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { icon: <ShieldCheck />, title: "Human-Proof", desc: "Verifiable on-chain identity", color: "from-teal-500 to-emerald-500" },
    { icon: <Zap />, title: "Lightning Fast", desc: "Solana-powered transactions", color: "from-cyan-500 to-blue-500" },
    { icon: <Users />, title: "Spam-Free", desc: "Zero AI-generated applications", color: "from-indigo-500 to-purple-500" },
    { icon: <Lock />, title: "Secure", desc: "Non-transferable credentials", color: "from-gray-700 to-gray-900" }
  ];

  const howItWorks = [
    {
      title: "Connect & Verify",
      steps: ["Connect wallet", "Human verification", "Get your Proof NFT"],
      icon: <Fingerprint className="h-8 w-8" />,
      color: "from-teal-500 to-emerald-500"
    },
    {
      title: "Apply Freely",
      steps: ["Browse opportunities", "One-click apply", "No CAPTCHAs needed"],
      icon: <Target className="h-8 w-8" />,
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Post Opportunities",
      steps: ["Create listings", "Set requirements", "Receive clean apps"],
      icon: <Award className="h-8 w-8" />,
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Scale Trust",
      steps: ["Verified ecosystem", "Reputation system", "Community growth"],
      icon: <TrendingUp className="h-8 w-8" />,
      color: "from-gray-700 to-gray-900"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-gray-50 text-gray-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 20, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ================= HERO ================= */}
      <motion.section 
        className="relative max-w-7xl mx-auto px-6 py-28 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="relative"
        >
          <Badge className="mb-6 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 border-0 text-white">
            <Sparkles className="mr-2 h-4 w-4" />
            Powered by Solana
          </Badge>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-gray-900 via-teal-600 to-gray-900 bg-clip-text text-transparent">
              Human-Only
            </span>
            <br />
            <motion.span 
              className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"
              animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ backgroundSize: "200% 100%" }}
            >
              Applications
            </motion.span>
          </motion.h1>

          <motion.p 
            className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            A <span className="font-semibold text-teal-600">Solana-powered</span> platform where jobs, 
            hackathons, and opportunities receive applications only from 
            <span className="font-semibold text-emerald-600"> real humans</span> — not bots.
          </motion.p>

          <motion.div 
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={scaleIn}>
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r cursor-pointer from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 group overflow-hidden text-white"
                onClick={() => navigate("/auth")}
              >
                <span className="relative z-10 flex items-center">
                  Apply as a User 
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </motion.div>
                </span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={false}
                />
              </Button>
            </motion.div>
            
            <motion.div variants={scaleIn} transition={{ delay: 0.1 }}>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/admin/auth")}
                className="border-gray-300 cursor-pointer text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Post an Opportunity
                <Rocket className="ml-3 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating Features */}
        <motion.div 
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-teal-300 transition-all shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color}/20 mb-4`}>
                    <div className="text-teal-600">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{feature.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ================= PROBLEM SECTION ================= */}
      <motion.section 
        className="relative max-w-6xl mx-auto px-6 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 via-orange-400 to-transparent"
          />
          
          <Badge variant="destructive" className="mb-6 bg-gradient-to-r from-red-500 to-orange-500 text-white">
            <Bot className="mr-2 h-4 w-4" />
            The Problem
          </Badge>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold leading-tight text-gray-900"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            AI is flooding every{" "}
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              application pipeline
            </span>
          </motion.h2>

          <motion.div 
            className="mt-10 grid md:grid-cols-2 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              "AI bots mass-apply to jobs & events",
              "Organizers waste hours filtering spam",
              "Genuine applicants get buried",
              "CAPTCHAs are obsolete against AI"
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="flex items-start space-x-4"
                whileHover={{ x: 10 }}
              >
                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-3 animate-pulse" />
                <p className="text-lg text-gray-700">{item}</p>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.p 
            className="mt-10 text-2xl font-bold text-gray-800 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200 backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            This problem didn't exist before AI — and Web2 platforms can't solve it.
          </motion.p>
        </div>
      </motion.section>

      {/* ================= SOLUTION ================= */}
      <motion.section 
        className="relative py-32"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/40 via-transparent to-cyan-50/40" />
        
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              The Solution
            </Badge>
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Proof that a{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                real human
              </span>{" "}
              applied
            </motion.h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-xl h-full">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {[
                      "Users verify once with on-chain identity",
                      "Non-transferable Human Proof NFT is issued",
                      "Every application checks this proof",
                      "Bots can't scale. Humans aren't blocked."
                    ].map((item, index) => (
                      <motion.div 
                        key={index}
                        className="flex items-center space-x-4"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-lg text-gray-700">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm border border-emerald-200 shadow-xl h-full">
                <CardContent className="p-8 flex flex-col items-center justify-center h-full text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                  >
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-200 border-t-emerald-500 flex items-center justify-center">
                      <ShieldCheck className="h-12 w-12 text-emerald-600" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Bot Prevention</h3>
                  <p className="text-gray-600">
                    We don't detect bots — we make spam impossible by design.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <Badge variant="outline" className="mb-6 border-gray-300">
            <Zap className="mr-2 h-4 w-4" />
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Simple for <span className="text-teal-600">everyone</span>,
            <br />
            impossible for <span className="text-red-500">bots</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              onHoverStart={() => setHoveredCard(index)}
              onHoverEnd={() => setHoveredCard(null)}
              className="relative"
            >
              <Card className={`bg-gradient-to-br ${item.color}/10 to-white backdrop-blur-sm border border-gray-200 h-full transition-all duration-300 ${hoveredCard === index ? 'border-teal-300' : 'border-gray-200'}`}>
                <CardContent className="p-8">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${item.color}/20 mb-6`}>
                    <div className="text-gray-900">
                      {item.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-4 text-gray-900">{item.title}</CardTitle>
                  <ul className="space-y-3">
                    {item.steps.map((step, i) => (
                      <motion.li 
                        key={i}
                        className="flex items-center text-gray-700"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color} mr-3`} />
                        {step}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <AnimatePresence>
                {hoveredCard === index && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-3 -right-3"
                  >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= SOLANA BENEFITS ================= */}
      <motion.section 
        className="py-32 bg-gradient-to-r from-teal-50 via-white to-cyan-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            className="flex items-center justify-center mb-12"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <div className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center space-x-3 text-white">
              <Globe className="h-5 w-5" />
              <span className="font-semibold">Built on Solana</span>
              <Clock className="h-5 w-5" />
            </div>
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            For speed, scale, and{" "}
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              fairness
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                { text: "Low fees → micro-verification possible", icon: "💸", color: "text-emerald-600" },
                { text: "Fast transactions → smooth UX", icon: "⚡", color: "text-amber-600" },
                { text: "On-chain proof → transparent & verifiable", icon: "🔗", color: "text-blue-600" },
                { text: "Non-transferable credentials → anti-bot by design", icon: "🛡️", color: "text-gray-800" }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center space-x-4 p-4 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors border border-gray-200"
                  whileHover={{ x: 10 }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`text-lg font-medium ${item.color}`}>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center"
            >
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 backdrop-blur-sm border border-teal-200 shadow-xl">
                <CardContent className="p-8 text-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                  >
                    <div className="w-32 h-32 mx-auto rounded-full border-4 border-teal-200 border-t-teal-500 flex items-center justify-center">
                      <Zap className="h-16 w-16 text-teal-600" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Blockchain Enforcement</h3>
                  <p className="text-gray-600">
                    Not a buzzword — it's the trust layer that makes human-only applications possible.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================= CTA WITH FEATURES ================= */}
      <motion.section 
        className="max-w-6xl mx-auto px-6 py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">What You Get</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Eye className="h-8 w-8" />, title: "Zero Spam", desc: "Only verified human applications", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: <Network className="h-8 w-8" />, title: "Solana Speed", desc: "Fast, low-cost transactions", color: "text-cyan-600", bg: "bg-cyan-50" },
              { icon: <FileText className="h-8 w-8" />, title: "Easy Management", desc: "Simple dashboard for all tasks", color: "text-gray-800", bg: "bg-gray-50" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`${item.bg} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <div className={item.color}>
                    {item.icon}
                  </div>
                </div>
                <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ================= FINAL CTA ================= */}
      <motion.section 
        className="max-w-6xl mx-auto px-6 py-32 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <motion.div
          variants={pulseAnimation}
          animate="animate"
          className="inline-block"
        >
          <div className="px-8 py-4 rounded-full bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 mb-8 border border-teal-200">
            <span className="text-lg text-teal-700 font-medium">Ready to join the future?</span>
          </div>
        </motion.div>

        <motion.h2 
          className="text-5xl md:text-6xl font-bold mb-8 text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          The future of applications is{" "}
          <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
            human-verified
          </span>
        </motion.h2>

        <motion.p 
          className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Join thousands of real humans and organizations building a spam-free ecosystem.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-6 justify-center"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div variants={scaleIn}>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="px-12 py-6 cursor-pointer text-lg bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white group"
            >
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex items-center"
              >
                Start Applying 
                <ArrowRight className="ml-3 h-5 w-5" />
              </motion.span>
            </Button>
          </motion.div>
          
          <motion.div variants={scaleIn} transition={{ delay: 0.1 }}>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/admin/auth")}
              className="px-12 py-6 cursor-pointer text-lg border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700"
            >
              <Rocket className="mr-3 h-5 w-5" />
              Post an Opportunity
            </Button>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-20 pt-10 border-t border-gray-200"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <motion.span whileHover={{ scale: 1.05 }} className="hover:text-gray-700">Zero spam guarantee</motion.span>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <motion.span whileHover={{ scale: 1.05 }} className="hover:text-gray-700">Solana-powered</motion.span>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <motion.span whileHover={{ scale: 1.05 }} className="hover:text-gray-700">100% human applications</motion.span>
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <motion.span whileHover={{ scale: 1.05 }} className="hover:text-gray-700">Open for all</motion.span>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}