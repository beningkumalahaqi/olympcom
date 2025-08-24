import '../globals.css'

export const metadata = {
  title: 'OlympCom - Under Maintenance',
  description: 'OlympCom is currently under maintenance. We will be back soon!',
}

export default function MaintenanceLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
