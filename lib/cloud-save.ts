const getToken = async (): Promise<string | null> => {
  const { data: { session } } = await fetch('/api/auth/session').then(r => r.json());
  return session?.access_token || null;
};

export const saveGame = async (gameId: string, saveData: any): Promise<boolean> => {
  const token = await getToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/game/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId, saveData }),
    });

    const result = await res.json();
    return result.success;
  } catch (error) {
    console.error('Save failed:', error);
    return false;
  }
};

export const loadGame = async (gameId: string): Promise<any | null> => {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`/api/game/load?gameId=${encodeURIComponent(gameId)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (result.success && result.hasSave) {
      return result.saveData;
    }
    return null;
  } catch (error) {
    console.error('Load failed:', error);
    return null;
  }
};
