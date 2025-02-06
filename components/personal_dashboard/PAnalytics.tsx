import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"


const taskCompletionData = [
    { name: "Mon", completed: 3, total: 5 },
    { name: "Tue", completed: 5, total: 8 },
    { name: "Wed", completed: 7, total: 10 },
    { name: "Thu", completed: 4, total: 6 },
    { name: "Fri", completed: 6, total: 9 },
]

const projectProgressData = [
    { name: "Week 1", actual: 20, expected: 25 },
    { name: "Week 2", actual: 40, expected: 50 },
    { name: "Week 3", actual: 65, expected: 75 },
    { name: "Week 4", actual: 90, expected: 100 },
]

export default function PAnalytics() {
    return (

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
            {/* Tasks Overview */}
            <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tasks Overview</CardTitle>
                    <Select defaultValue="week">
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            completed: {
                                label: "Completed",
                                color: "hsl(var(--chart-primary))",
                            },
                            total: {
                                label: "Total",
                                color: "hsl(var(--chart-secondary))",
                            },
                        }}
                        className="h-[300px] w-full"
                    >
                        <BarChart data={taskCompletionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Bar
                                dataKey="completed"
                                fill="hsl(var(--chart-primary))"
                                radius={[4, 4, 0, 0]}
                                cursor="pointer"
                            />
                            <Bar
                                dataKey="total"
                                fill="hsl(var(--chart-secondary))"
                                radius={[4, 4, 0, 0]}
                                cursor="pointer"
                            />
                            <ChartTooltip
                                content={<ChartTooltipContent />}
                                cursor={{
                                    fill: 'hsl(var(--muted))',
                                    opacity: 0.1
                                }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    padding: "8px",
                                }}
                            />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Project Progress */}
            <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Project Progress</CardTitle>
                    <Select defaultValue="month">
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            actual: {
                                label: "Actual",
                                color: "hsl(var(--chart-success))",
                            },
                            expected: {
                                label: "Expected",
                                color: "hsl(var(--chart-muted))",
                            },
                        }}
                        className="h-[300px] w-full"
                    >
                        <LineChart data={projectProgressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                            <XAxis
                                dataKey="name"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="hsl(var(--chart-success))"
                                strokeWidth={2}
                                dot={{
                                    fill: "hsl(var(--background))",
                                    r: 4,
                                    strokeWidth: 2,
                                    stroke: "hsl(var(--chart-success))"
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: "hsl(var(--chart-success))",
                                    strokeWidth: 2,
                                    fill: "hsl(var(--background))"
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expected"
                                stroke="hsl(var(--chart-muted))"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{
                                    fill: "hsl(var(--background))",
                                    r: 4,
                                    strokeWidth: 2,
                                    stroke: "hsl(var(--chart-muted))"
                                }}
                                activeDot={{
                                    r: 6,
                                    stroke: "hsl(var(--chart-muted))",
                                    strokeWidth: 2,
                                    fill: "hsl(var(--background))"
                                }}
                            />
                            <ChartTooltip
                                content={<ChartTooltipContent />}
                                cursor={{ stroke: 'hsl(var(--chart-grid))' }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    padding: "8px",
                                }}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>

    )
}