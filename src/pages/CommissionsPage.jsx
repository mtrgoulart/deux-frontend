import { useTranslation } from 'react-i18next';
import CommissionHistory from '../components/CommissionHistory';

function CommissionsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="container mx-auto px-4 md:px-6 py-6">
        <div className="bg-surface border border-border rounded-lg px-6 py-5 mb-6">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 tracking-wider uppercase">
            {t('commissions.title')}
          </h1>
        </div>

        <CommissionHistory />
      </div>
    </div>
  );
}

export default CommissionsPage;
