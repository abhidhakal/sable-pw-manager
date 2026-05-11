import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { ToastContainer } from '@/components/ui/Toast'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}
