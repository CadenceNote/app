import { Bird } from "../common/Bird";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";


export default function SummarySection() {
    return (
        <Card className="border-indigo-100 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>AI-powered insights and analytics to help your team stay on top of work.</CardDescription>
            </CardHeader>
            <CardContent className="relative">
                {/* Bird Container */}
                <Bird />
                {/* Speech Bubble */}
                <div className="relative ml-16 p-4 bg-gradient-to-br from-green-50 to-indigo-50 rounded-2xl">
                    {/* Speech Bubble Pointer */}
                    <div className="absolute -left-3 top-6 w-4 h-4 bg-gradient-to-br from-green-50 to-indigo-50 transform rotate-45"></div>
                    <textarea
                        className="w-full h-40 bg-transparent border-none rounded-md p-2 focus:ring-0 placeholder:text-gray-400"
                        placeholder="Hi there! Here's your AI-powered team summary..."
                        style={{ resize: 'none' }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
