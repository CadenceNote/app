import { auth } from "@/services/api"
const handleSignOut = async (router: any) => {
    try {
        await auth.logout()
        router.push('/')
    } catch (error) {
        console.error('Error signing out:', error)
    }
}

export default handleSignOut;