import { useState, useEffect } from 'react';
import { generatePrivateKey, getPublicKey, finishEvent, SimplePool } from 'nostr-tools';
import './App.css';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.nostr.band'
];

// 板（カテゴリ）の定義
const BOARDS = [
  { id: 'news', name: 'ニュース速報', tag: 'board:news' },
  { id: 'vip', name: 'ニュー速VIP', tag: 'board:vip' },
  { id: 'tech', name: 'プログラミング', tag: 'board:tech' },
  { id: 'life', name: '生活全般', tag: 'board:life' },
  { id: 'anime', name: 'アニメ', tag: 'board:anime' },
  { id: 'game', name: 'ゲーム', tag: 'board:game' }
];

function App() {
  const [sk, setSk] = useState('');
  const [pk, setPk] = useState('');
  const [currentView, setCurrentView] = useState('boardList'); // boardList, threadList, thread
  const [currentBoard, setCurrentBoard] = useState(null);
  const [currentThread, setCurrentThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newPost, setNewPost] = useState('');
  const [pool] = useState(() => new SimplePool());
  const [userName, setUserName] = useState('名無しさん');
  const [uploading, setUploading] = useState(false);

  // 鍵の初期化
  useEffect(() => {
    let savedSk = localStorage.getItem('2ch_sk');
    let savedPk = localStorage.getItem('2ch_pk');
    
    if (!savedSk) {
      savedSk = generatePrivateKey();
      savedPk = getPublicKey(savedSk);
      localStorage.setItem('2ch_sk', savedSk);
      localStorage.setItem('2ch_pk', savedPk);
    }
    
    setSk(savedSk);
    setPk(savedPk);

    const savedName = localStorage.getItem('userName');
    if (savedName) setUserName(savedName);
  }, []);

  // ユーザー名を保存
  const saveUserName = () => {
    localStorage.setItem('userName', userName);
    alert('名前を保存しました');
  };

  // スレッド一覧を取得
  const loadThreads = (board) => {
    setCurrentBoard(board);
    setCurrentView('threadList');
    setThreads([]);

    pool.subscribeMany(
      RELAYS,
      [{
        kinds: [1],
        '#t': [board.tag],
        '#thread': ['true'],
        limit: 50
      }],
      {
        onevent(event) {
          setThreads(prev => {
            if (prev.some(t => t.id === event.id)) return prev;
            return [event, ...prev].sort((a, b) => b.created_at - a.created_at);
          });
        }
      }
    );
  };

  // スレッドを作成
  const createThread = async () => {
    if (!newThreadTitle.trim()) {
      alert('スレッドタイトルを入力してください');
      return;
    }

    const event = {
      kind: 1,
      pubkey: pk,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', currentBoard.tag],
        ['thread', 'true'],
        ['title', newThreadTitle]
      ],
      content: `【${newThreadTitle}】\n\n1 名前: ${userName} ${new Date().toLocaleString()}\nスレ立て`
    };

    const signedEvent = finishEvent(event, sk);

    try {
      await Promise.any(pool.publish(RELAYS, signedEvent));
      alert('スレッドを立てました！');
      setNewThreadTitle('');
      loadThreads(currentBoard);
    } catch (e) {
      alert('エラー: ' + e.message);
    }
  };

  // スレッドを開く
  const openThread = (thread) => {
    setCurrentThread(thread);
    setCurrentView('thread');
    setPosts([]);

    // スレッド本体を追加
    setPosts([thread]);

    // 返信を取得
    pool.subscribeMany(
      RELAYS,
      [{
        kinds: [1],
        '#e': [thread.id],
        limit: 500
      }],
      {
        onevent(event) {
          setPosts(prev => {
            if (prev.some(p => p.id === event.id)) return prev;
            return [...prev, event].sort((a, b) => a.created_at - b.created_at);
          });
        }
      }
    );
  };

  // レスを書き込む
  const writePost = async () => {
    if (!newPost.trim()) {
      alert('本文を入力してください');
      return;
    }

    const postNumber = posts.length + 1;
    const event = {
      kind: 1,
      pubkey: pk,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['e', currentThread.id],
        ['p', currentThread.pubkey]
      ],
      content: `${postNumber} 名前: ${userName} ${new Date().toLocaleString()}\n${newPost}`
    };

    const signedEvent = finishEvent(event, sk);

    try {
      await Promise.any(pool.publish(RELAYS, signedEvent));
      setNewPost('');
    } catch (e) {
      alert('エラー: ' + e.message);
    }
  };

  // スレッドタイトルを抽出
  const getThreadTitle = (thread) => {
    const titleTag = thread.tags.find(t => t[0] === 'title');
    return titleTag ? titleTag[1] : thread.content.split('\n')[0].slice(0, 50);
  };

  // レス数を取得
  const getReplyCount = (threadId) => {
    return posts.filter(p => p.tags.some(t => t[0] === 'e' && t[1] === threadId)).length;
  };

  // 画像をアップロード（Imgur使用）
  const uploadImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          'Authorization': 'Client-ID 3e7a4deb7ac67da' // 公開用Client ID
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setUploading(false);
        return data.data.link;
      } else {
        throw new Error('アップロード失敗');
      }
    } catch (e) {
      setUploading(false);
      alert('画像のアップロードに失敗しました: ' + e.message);
      return null;
    }
  };

  // 画像選択時の処理
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setNewPost(prev => prev + '\n' + imageUrl);
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ margin: 0 }}>📋 分散型2ch (Nostr版)</h1>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          名前: 
          <input 
            type="text" 
            value={userName} 
            onChange={e => setUserName(e.target.value)}
            style={{ marginLeft: '5px', padding: '2px', width: '100px' }}
          />
          <button onClick={saveUserName} style={smallButtonStyle}>保存</button>
        </div>
      </header>

      {/* 板一覧 */}
      {currentView === 'boardList' && (
        <div style={contentStyle}>
          <h2>📁 板一覧</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {BOARDS.map(board => (
              <div 
                key={board.id} 
                style={boardItemStyle}
                onClick={() => loadThreads(board)}
              >
                <h3 style={{ margin: 0 }}>{board.name}</h3>
                <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#666' }}>
                  {board.tag}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* スレッド一覧 */}
      {currentView === 'threadList' && (
        <div style={contentStyle}>
          <div style={navStyle}>
            <button onClick={() => setCurrentView('boardList')} style={buttonStyle}>
              ← 板一覧に戻る
            </button>
          </div>
          
          <h2>📝 {currentBoard.name}</h2>
          
          {/* 新スレ作成 */}
          <div style={newThreadStyle}>
            <h3>新しいスレッドを立てる</h3>
            <input
              type="text"
              value={newThreadTitle}
              onChange={e => setNewThreadTitle(e.target.value)}
              placeholder="スレッドタイトル"
              style={inputStyle}
            />
            <button onClick={createThread} style={buttonStyle}>
              スレッドを立てる
            </button>
          </div>

          {/* スレッド一覧 */}
          <div style={{ marginTop: '20px' }}>
            <h3>スレッド一覧 ({threads.length}件)</h3>
            {threads.length === 0 ? (
              <p>スレッドがありません。最初のスレッドを立ててください！</p>
            ) : (
              threads.map((thread, index) => (
                <div 
                  key={thread.id} 
                  style={threadItemStyle}
                  onClick={() => openThread(thread)}
                >
                  <span style={{ color: '#666', marginRight: '10px' }}>{index + 1}:</span>
                  <span style={{ fontWeight: 'bold' }}>{getThreadTitle(thread)}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
                    ({new Date(thread.created_at * 1000).toLocaleDateString()})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* スレッド内 */}
      {currentView === 'thread' && (
        <div style={contentStyle}>
          <div style={navStyle}>
            <button onClick={() => setCurrentView('threadList')} style={buttonStyle}>
              ← スレッド一覧に戻る
            </button>
          </div>

          <h2>💬 {getThreadTitle(currentThread)}</h2>

          {/* レス表示 */}
          <div style={threadContentStyle}>
            {posts.map((post, index) => {
              // URLを検出して画像表示
              const lines = post.content.split('\n');
              const imageUrls = lines.filter(line => 
                line.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)
              );
              const textContent = lines.filter(line => 
                !line.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)
              ).join('\n');

              return (
                <div key={post.id} style={postStyle}>
                  <pre style={{ 
                    margin: 0, 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: '"ＭＳ Ｐゴシック", "MS PGothic", sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {textContent}
                  </pre>
                  {imageUrls.map((url, i) => (
                    <div key={i} style={{ marginTop: '10px' }}>
                      <img 
                        src={url} 
                        alt="投稿画像" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '400px',
                          border: '1px solid #999'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* 書き込みフォーム */}
          <div style={writeFormStyle}>
            <h3>レスを書く</h3>
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="本文を入力..."
              rows={6}
              style={textareaStyle}
            />
            <div style={{ marginBottom: '10px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                id="image-upload"
              />
              <label htmlFor="image-upload" style={{
                ...buttonStyle,
                display: 'inline-block',
                marginRight: '10px',
                opacity: uploading ? 0.5 : 1
              }}>
                {uploading ? '📤 アップロード中...' : '🖼️ 画像を添付'}
              </label>
              <button onClick={writePost} style={buttonStyle}>
                書き込む
              </button>
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              ※画像は10MB以下、URLが本文に追加されます
            </div>
          </div>
        </div>
      )}

      <footer style={footerStyle}>
        <p style={{ margin: 0, fontSize: '12px' }}>
          Powered by Nostr Protocol | 完全分散型 | 検閲なし
        </p>
      </footer>
    </div>
  );
}

// スタイル定義
const containerStyle = {
  minHeight: '100vh',
  backgroundColor: '#EFEFEF',
  fontFamily: 'sans-serif'
};

const headerStyle = {
  backgroundColor: '#EA8',
  color: '#800',
  padding: '10px 20px',
  borderBottom: '1px solid #000'
};

const contentStyle = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: 'white',
  minHeight: 'calc(100vh - 120px)'
};

const navStyle = {
  marginBottom: '20px'
};

const buttonStyle = {
  padding: '8px 16px',
  backgroundColor: '#EA8',
  border: '1px solid #800',
  color: '#800',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const smallButtonStyle = {
  padding: '2px 8px',
  fontSize: '11px',
  backgroundColor: '#EA8',
  border: '1px solid #800',
  color: '#800',
  cursor: 'pointer',
  marginLeft: '5px'
};

const boardItemStyle = {
  padding: '15px',
  backgroundColor: '#F0F0F0',
  border: '1px solid #CCC',
  cursor: 'pointer',
  transition: 'background 0.2s'
};

const newThreadStyle = {
  padding: '15px',
  backgroundColor: '#FFF8DC',
  border: '1px solid #CCC',
  marginBottom: '20px'
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '10px',
  border: '1px solid #CCC',
  fontSize: '14px'
};

const threadItemStyle = {
  padding: '10px',
  borderBottom: '1px solid #CCC',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  transition: 'background 0.2s'
};

const threadContentStyle = {
  backgroundColor: '#EFEFEF',
  padding: '10px',
  marginBottom: '20px'
};

const postStyle = {
  backgroundColor: '#F0E0D6',
  padding: '10px',
  marginBottom: '5px',
  border: '1px solid #CCC'
};

const writeFormStyle = {
  padding: '15px',
  backgroundColor: '#E0E8F0',
  border: '1px solid #CCC'
};

const textareaStyle = {
  width: '100%',
  padding: '8px',
  marginBottom: '10px',
  border: '1px solid #CCC',
  fontSize: '14px',
  fontFamily: 'monospace',
  resize: 'vertical'
};

const footerStyle = {
  backgroundColor: '#EA8',
  color: '#800',
  padding: '10px',
  textAlign: 'center',
  borderTop: '1px solid #000'
};

export default App;
