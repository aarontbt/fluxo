"use client"

import { Wifi } from 'lucide-react'

export function MobileStatusBar() {
  return (
    <div className="flex justify-between items-center px-6 py-3 text-sm font-medium bg-white border-b border-gray-100">
      <div className="text-gray-900">9:41</div>
      
      <div className="flex items-center gap-2">
        {/* Signal bars */}
        <div className="flex items-end gap-1">
          <div className="w-1 h-2 bg-gray-900 rounded-full"></div>
          <div className="w-1 h-3 bg-gray-900 rounded-full"></div>
          <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
          <div className="w-1 h-2 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* WiFi */}
        <Wifi className="w-4 h-4 text-gray-900" />
        
        {/* Battery */}
        <div className="relative">
          <div className="w-6 h-3 border border-gray-900 rounded-sm">
            <div className="w-4 h-full bg-gray-900 rounded-sm"></div>
          </div>
          <div className="absolute -right-1 top-1 w-1 h-1 bg-gray-900 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}