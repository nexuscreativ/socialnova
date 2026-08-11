"use client"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change: number
}

export function StatsCard({ title, value, change }: StatsCardProps) {
  const isPositive = change >= 0

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
      transition={{ duration: 0.2 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-plus-jakarta)' }}
          >
            {value}
          </motion.div>
          <div className={`flex items-center gap-1 text-xs mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              {isPositive ? '+' : ''}{change}% from last week
            </motion.span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
