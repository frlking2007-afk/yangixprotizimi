
import React, { useState } from 'react';
import Layout from './components/Layout';
import XPro from './pages/XPro';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('xpro');

  const renderContent = () => {
    switch (activeTab) {
      case 'xpro':
        return <XPro />;
      case 'xisobotlar':
        return <Reports />;
      case 'sozlama':
        return <Settings />;
      default:
        return <XPro />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
