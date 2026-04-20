import { IconHammer } from '@tabler/icons-react'

export default function ComingSoonPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center px-6">
      <div className="w-14 h-14 bg-[#f5f5f0] rounded-xl flex items-center justify-center mb-4">
        <IconHammer size={24} className="text-[#bbb]" />
      </div>
      <h2 className="text-sm font-bold text-[#0f172a] mb-1">{title || 'Bu bölmə hazırlanır'}</h2>
      <p className="text-xs text-[#aaa] max-w-xs">
        Bu bölmə tezliklə əlavə ediləcək. Hal-hazırda Dashboard, Layihələr, Tapşırıqlar, Maliyyə əsas modulları aktivdir.
      </p>
    </div>
  )
}
