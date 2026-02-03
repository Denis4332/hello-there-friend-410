import { supabase } from '@/integrations/supabase/client';

// Parse combined changes from description
interface ChangeGroup {
  type: string;
  changes: { field: string; old_value: string; new_value: string }[];
}

export const parseDescription = (description: string): ChangeGroup[] | null => {
  try {
    const parsed = JSON.parse(description);
    // Check if it's the new combined format (array of change groups)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type && parsed[0].changes) {
      return parsed as ChangeGroup[];
    }
    return null;
  } catch {
    return null;
  }
};

interface ChangeRequest {
  id: string;
  profile_id: string;
  description: string;
  request_type: string;
}

interface RequestMedia {
  id: string;
  request_id: string;
  storage_path: string;
  signedUrl?: string;
}

// Apply all changes from a change request to the profile
export const applyChangesToProfile = async (
  request: ChangeRequest,
  mediaUrls: Record<string, RequestMedia[]>
): Promise<{ success: boolean; error?: string }> => {
  const changeGroups = parseDescription(request.description);
  
  // Handle legacy format (simple array of changes)
  let allChanges: { field: string; old_value: string; new_value: string }[] = [];
  
  if (changeGroups) {
    // New combined format
    for (const group of changeGroups) {
      allChanges = [...allChanges, ...group.changes];
    }
  } else {
    // Try legacy format
    try {
      const legacyChanges = JSON.parse(request.description);
      if (Array.isArray(legacyChanges)) {
        allChanges = legacyChanges;
      }
    } catch {
      // Plain text description - no structured changes to apply
      console.log('No structured changes to apply for request:', request.id);
      return { success: true };
    }
  }

  const profileUpdates: Record<string, any> = {};
  const contactUpdates: Record<string, any> = {};
  let categoryIds: string[] | null = null;

  for (const change of allChanges) {
    switch (change.field) {
      // Profile fields
      case 'display_name':
      case 'about_me':
      case 'city':
      case 'canton':
      case 'postal_code':
        profileUpdates[change.field] = change.new_value;
        break;
      case 'coordinates':
        if (change.new_value) {
          const [lat, lng] = change.new_value.split(',');
          profileUpdates.lat = parseFloat(lat);
          profileUpdates.lng = parseFloat(lng);
        }
        break;
      // Contact fields
      case 'phone':
      case 'whatsapp':
      case 'email':
      case 'website':
      case 'telegram':
      case 'instagram':
        contactUpdates[change.field] = change.new_value || null;
        break;
      // Categories - could be UUIDs or names, need to handle both
      case 'categories':
        // Store raw value, will be resolved to UUIDs later
        categoryIds = change.new_value ? change.new_value.split(',').map(s => s.trim()).filter(Boolean) : [];
        break;
    }
  }

  try {
    // 1. Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', request.profile_id);
      
      if (error) throw error;
    }

    // 2. Update profile_contacts table
    if (Object.keys(contactUpdates).length > 0) {
      contactUpdates.updated_at = new Date().toISOString();
      
      // Check if contact exists
      const { data: existingContact } = await supabase
        .from('profile_contacts')
        .select('id')
        .eq('profile_id', request.profile_id)
        .maybeSingle();

      if (existingContact) {
        const { error } = await supabase
          .from('profile_contacts')
          .update(contactUpdates)
          .eq('profile_id', request.profile_id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profile_contacts')
          .insert({
            profile_id: request.profile_id,
            ...contactUpdates
          });
        
        if (error) throw error;
      }
    }

    // 3. Update categories
    if (categoryIds !== null) {
      // Delete old categories
      await supabase
        .from('profile_categories')
        .delete()
        .eq('profile_id', request.profile_id);
      
      // Insert new categories (resolve names to UUIDs if needed)
      if (categoryIds.length > 0) {
        // Check if values are UUIDs or names
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        
        let resolvedCategoryIds: string[] = [];
        
        const uuids = categoryIds.filter(isUUID);
        const names = categoryIds.filter(id => !isUUID(id));
        
        // Add UUIDs directly
        resolvedCategoryIds = [...uuids];
        
        // Resolve names to UUIDs
        if (names.length > 0) {
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .in('name', names);
          
          if (categories) {
            resolvedCategoryIds = [
              ...resolvedCategoryIds,
              ...categories.map(c => c.id)
            ];
          }
        }
        
        // Insert resolved category IDs
        if (resolvedCategoryIds.length > 0) {
          const { error } = await supabase
            .from('profile_categories')
            .insert(resolvedCategoryIds.map(id => ({
              profile_id: request.profile_id,
              category_id: id
            })));
          
          if (error) throw error;
        }
      }
    }

    // 4. Process photo changes
    await processPhotoChanges(request, mediaUrls);

    return { success: true };
  } catch (error) {
    console.error('Error applying changes:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Process photo-specific changes
const processPhotoChanges = async (
  request: ChangeRequest,
  mediaUrls: Record<string, RequestMedia[]>
): Promise<void> => {
  const changeGroups = parseDescription(request.description);
  const photoGroup = changeGroups?.find(g => g.type === 'photos');
  
  if (!photoGroup) return;

  for (const change of photoGroup.changes) {
    // Delete photos
    if (change.field === 'delete_photos' && change.new_value) {
      const idsToDelete = change.new_value.split(',').filter(Boolean);
      
      for (const photoId of idsToDelete) {
        const { data: photo } = await supabase
          .from('photos')
          .select('storage_path')
          .eq('id', photoId)
          .single();
        
        if (photo) {
          // Delete from storage
          await supabase.storage
            .from('profile-photos')
            .remove([photo.storage_path]);
          
          // Delete from database
          await supabase
            .from('photos')
            .delete()
            .eq('id', photoId);
        }
      }
    }
    
    // Update primary photo
    if (change.field === 'primary_photo' && change.new_value) {
      // First, set all photos to non-primary
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('profile_id', request.profile_id);
      
      // Then set the new primary
      await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', change.new_value);
    }
    
    // Copy new photos from change-request-media to profile-photos
    if (change.field === 'new_photos') {
      const media = mediaUrls[request.id];
      
      if (media?.length) {
        for (const m of media) {
          try {
            // Download from change-request-media
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('change-request-media')
              .download(m.storage_path);
            
            if (downloadError || !fileData) {
              console.error('Error downloading media:', downloadError);
              continue;
            }
            
            // Generate new path in profile-photos
            const extension = m.storage_path.split('.').pop() || 'jpg';
            const newPath = `${request.profile_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
            
            // Upload to profile-photos
            const { error: uploadError } = await supabase.storage
              .from('profile-photos')
              .upload(newPath, fileData);
            
            if (uploadError) {
              console.error('Error uploading to profile-photos:', uploadError);
              continue;
            }
            
            // Create database entry
            await supabase.from('photos').insert({
              profile_id: request.profile_id,
              storage_path: newPath,
              is_primary: false,
              media_type: 'image'
            });
          } catch (error) {
            console.error('Error processing new photo:', error);
          }
        }
      }
    }
  }
};
