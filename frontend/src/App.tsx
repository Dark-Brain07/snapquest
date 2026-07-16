import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Camera, PlusCircle, Coins, Search } from 'lucide-react';
import './index.css';

export const CONTRACT_ADDRESS = "0x309ccfc772dAB0611a90aD9895cBDc8619A60c68";

// Quests will be fetched from the GenLayer intelligent contract
const MOCK_QUESTS: any[] = [];

function App() {
  const { isConnected } = useAccount();
  const [view, setView] = useState<'feed' | 'create'>('feed');
  
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newBounty, setNewBounty] = useState('');

  const renderHeader = () => (
    <header className="header">
      <div>
        <h1>📸 SnapQuest</h1>
        <p style={{ fontWeight: 700, opacity: 0.8 }}>The Decentralized AI Scavenger Hunt</p>
      </div>
      <div>
        <ConnectButton />
      </div>
    </header>
  );

  const renderFeed = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Active Quests</h2>
        {isConnected && (
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <PlusCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'bottom' }} /> 
            Create Quest
          </button>
        )}
      </div>

      <div className="quest-grid">
        {MOCK_QUESTS.map(quest => (
          <div key={quest.id} className="card quest-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className={`badge ${quest.active ? 'active' : 'closed'}`}>
                {quest.active ? 'Active' : 'Closed'}
              </span>
              <div className="bounty-amount">
                <Coins size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> 
                {quest.bounty} GEN
              </div>
            </div>
            
            <h3>{quest.title}</h3>
            <p>"{quest.prompt}"</p>
            
            {quest.active ? (
              <button className="btn btn-tertiary" style={{ width: '100%' }}>
                <Camera size={18} style={{ display: 'inline', marginRight: '8px' }} /> 
                Submit Photo
              </button>
            ) : (
              <button className="btn" disabled style={{ width: '100%', opacity: 0.5 }}>
                Quest Ended
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Create a New Quest</h2>
      
      <label style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'block' }}>Quest Title</label>
      <input 
        className="input-field" 
        placeholder="e.g. Find the Red Door"
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
      />
      
      <label style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'block' }}>Objective Prompt (For the AI Judge)</label>
      <textarea 
        className="input-field" 
        placeholder="Describe exactly what the photo must contain..."
        rows={4}
        value={newPrompt}
        onChange={e => setNewPrompt(e.target.value)}
      />
      
      <label style={{ fontWeight: 900, marginBottom: '0.5rem', display: 'block' }}>Bounty (GEN)</label>
      <input 
        className="input-field" 
        type="number"
        placeholder="e.g. 100"
        value={newBounty}
        onChange={e => setNewBounty(e.target.value)}
      />
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-primary" style={{ flex: 1 }}>Launch Quest!</button>
        <button className="btn" onClick={() => setView('feed')}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      {renderHeader()}
      <main>
        {!isConnected ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Search size={64} color="#FFAACB" style={{ marginBottom: '2rem' }} />
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to SnapQuest</h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Connect your wallet to start hunting and earning GEN!</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ConnectButton />
            </div>
          </div>
        ) : (
          view === 'feed' ? renderFeed() : renderCreate()
        )}
      </main>
    </div>
  );
}

export default App;
