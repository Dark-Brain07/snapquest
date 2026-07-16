import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient } from 'wagmi';
import { Camera, PlusCircle, Coins, Search, Loader2 } from 'lucide-react';
import { readContract, writeContract, makeWalletClient } from './genlayer';
import './index.css';

export const CONTRACT_ADDRESS = "0x309ccfc772dAB0611a90aD9895cBDc8619A60c68";

function App() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [view, setView] = useState<'feed' | 'create'>('feed');
  
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newBounty, setNewBounty] = useState('');
  
  const [submittingPhoto, setSubmittingPhoto] = useState<number | null>(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const countRes = await readContract("get_quest_count");
      const count = Number(countRes);
      
      const fetchedQuests = [];
      for (let i = 0; i < count; i++) {
        const quest = await readContract("get_quest", [i]);
        fetchedQuests.push(quest);
      }
      // Reverse to show newest first
      setQuests(fetchedQuests.reverse());
    } catch (err) {
      console.error("Failed to fetch quests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchQuest = async () => {
    if (!walletClient || !address) return;
    try {
      setLoading(true);
      const glClient = makeWalletClient(walletClient, address);
      const bountyWei = BigInt(newBounty) * 10n ** 18n;
      
      await writeContract(glClient, "create_quest", [newTitle, newPrompt, bountyWei], bountyWei);
      
      setView('feed');
      setNewTitle('');
      setNewPrompt('');
      setNewBounty('');
      await fetchQuests();
    } catch (err) {
      console.error(err);
      alert("Failed to launch quest");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPhoto = async (questId: number) => {
    if (!walletClient || !address) return;
    const url = prompt("Enter the exact URL of your photo to submit to the AI Judge:");
    if (!url) return;
    
    try {
      setSubmittingPhoto(questId);
      const glClient = makeWalletClient(walletClient, address);
      
      alert("Photo submitted! The GenLayer Vision AI is now analyzing your image. This takes about 10-20 seconds to reach consensus.");
      await writeContract(glClient, "submit_photo", [questId, url]);
      
      alert("AI Evaluation Complete! Check your wallet balance to see if you won!");
      await fetchQuests();
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Make sure the photo URL is a direct link to an image (e.g. .jpg or .png) and try again.");
    } finally {
      setSubmittingPhoto(null);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2>Active Quests</h2>
          <button className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }} onClick={fetchQuests}>
            Refresh
          </button>
        </div>
        {isConnected && (
          <button className="btn btn-primary" onClick={() => setView('create')}>
            <PlusCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'bottom' }} /> 
            Create Quest
          </button>
        )}
      </div>

      {loading && quests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="#FFAACB" style={{ margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', fontWeight: 700 }}>Fetching quests from GenLayer...</p>
        </div>
      ) : quests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>No Quests Yet!</h3>
          <p>Be the first to create a Scavenger Hunt on GenLayer!</p>
        </div>
      ) : (
        <div className="quest-grid">
          {quests.map(quest => {
            const bountyFormatted = Number(quest.bounty_amount) / 10**18;
            const balanceFormatted = Number(quest.escrow_balance) / 10**18;
            return (
              <div key={quest.id} className="card quest-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className={`badge ${quest.active ? 'active' : 'closed'}`}>
                    {quest.active ? 'Active' : 'Closed'}
                  </span>
                  <div className="bounty-amount">
                    <Coins size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> 
                    {bountyFormatted} GEN
                  </div>
                </div>
                
                <h3>{quest.title}</h3>
                <p>"{quest.prompt}"</p>
                <div style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.7, fontWeight: 700 }}>
                  Escrow Remaining: {balanceFormatted} GEN
                </div>
                
                {quest.active ? (
                  <button 
                    className="btn btn-tertiary" 
                    style={{ width: '100%' }}
                    onClick={() => handleSubmitPhoto(quest.id)}
                    disabled={submittingPhoto === quest.id}
                  >
                    {submittingPhoto === quest.id ? (
                      <Loader2 className="animate-spin" size={18} style={{ display: 'inline', marginRight: '8px', animation: 'spin 1s linear infinite' }} /> 
                    ) : (
                      <Camera size={18} style={{ display: 'inline', marginRight: '8px' }} /> 
                    )}
                    {submittingPhoto === quest.id ? 'AI Judging...' : 'Submit Photo'}
                  </button>
                ) : (
                  <button className="btn" disabled style={{ width: '100%', opacity: 0.5 }}>
                    Quest Ended
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
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
        placeholder="e.g. 10"
        value={newBounty}
        onChange={e => setNewBounty(e.target.value)}
      />
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleLaunchQuest} disabled={loading}>
          {loading ? 'Confirming...' : 'Launch Quest!'}
        </button>
        <button className="btn" onClick={() => setView('feed')} disabled={loading}>Cancel</button>
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
