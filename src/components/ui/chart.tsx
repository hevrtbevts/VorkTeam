
"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
} from "recharts"
import {
  Color,
  getColor,
  type ChartConfig,
  type ChartContainerProps,
} from "recharts-extend"

import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartTooltipContentProps,
} from "recharts-extend"

// TODO: fix this
// import { ChartContainer } from "@/components/ui/chart"

const ChartProvider = ({
  config,
  children,
}: {
  config: ChartConfig
  children: React.ReactNode
}) => {
  const id = React.useId()
  const [activeChart, setActiveChart] = React.useState<keyof typeof config>()

  const providerValue = React.useMemo(
    () => ({
      config,
      activeChart,
      setActiveChart,
      chartId: `chart-${id}`,
    }),
    [config, activeChart, setActiveChart, id]
  )

  return <ChartStyle config={config}>{children}</ChartStyle>
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartProvider,
}
export type { ChartConfig, ChartContainerProps, ChartTooltipContentProps }

```