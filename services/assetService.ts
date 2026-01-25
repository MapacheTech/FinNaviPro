import { supabase } from './supabaseClient';
import { Asset } from '../types';

// Extended asset type to include additional DB fields
export type AssetType = 'cash' | 'investment' | 'property' | 'crypto' | 'vehicle' | 'other';

export interface AssetInput {
  name: string;
  value: number;
  type: AssetType;
  notes?: string;
}

export const assetService = {
  /**
   * Get all assets for the current user
   */
  async getAssets(): Promise<Asset[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      value: Number(row.value),
      type: row.type as Asset['type']
    }));
  },

  /**
   * Get total assets value
   */
  async getTotalValue(): Promise<number> {
    const assets = await this.getAssets();
    return assets.reduce((sum, a) => sum + a.value, 0);
  },

  /**
   * Add a new asset
   */
  async addAsset(asset: AssetInput): Promise<Asset | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        name: asset.name,
        value: asset.value,
        type: asset.type,
        notes: asset.notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding asset:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      value: Number(data.value),
      type: data.type as Asset['type']
    };
  },

  /**
   * Update an existing asset
   */
  async updateAsset(id: string, updates: Partial<AssetInput>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating asset:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete an asset
   */
  async deleteAsset(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting asset:', error);
      return false;
    }

    return true;
  },

  /**
   * Get assets grouped by type with totals
   */
  async getAssetsByType(): Promise<Record<AssetType, { assets: Asset[]; total: number }>> {
    const assets = await this.getAssets();

    const grouped: Record<AssetType, { assets: Asset[]; total: number }> = {
      cash: { assets: [], total: 0 },
      investment: { assets: [], total: 0 },
      property: { assets: [], total: 0 },
      crypto: { assets: [], total: 0 },
      vehicle: { assets: [], total: 0 },
      other: { assets: [], total: 0 }
    };

    for (const asset of assets) {
      const type = asset.type as AssetType;
      if (grouped[type]) {
        grouped[type].assets.push(asset);
        grouped[type].total += asset.value;
      }
    }

    return grouped;
  }
};
