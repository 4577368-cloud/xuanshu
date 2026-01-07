
import { UserProfile, AiReportRecord } from "../types";

const STORAGE_KEY = 'xuanshu_archive_v1';

export const getArchives = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed: any[] = JSON.parse(data);
    
    // Migration Logic: Convert old 'aiReport' string to 'aiReports' array
    return parsed.map(p => {
        if (p.aiReport && (!p.aiReports || p.aiReports.length === 0)) {
            return {
                ...p,
                aiReports: [{
                    id: Date.now().toString(),
                    date: p.lastUpdated || Date.now(),
                    content: p.aiReport
                }],
                aiReport: undefined // Clear legacy field
            };
        }
        return p;
    });
  } catch (e) {
    console.error("Failed to load archives", e);
    return [];
  }
};

export const saveArchive = (profile: UserProfile): UserProfile[] => {
  const archives = getArchives();
  const index = archives.findIndex(p => p.id === profile.id);
  
  const updatedProfile = {
      ...profile,
      lastUpdated: Date.now()
  };

  let newArchives;
  if (index >= 0) {
    // Update existing
    newArchives = [...archives];
    newArchives[index] = updatedProfile;
  } else {
    // Add new
    newArchives = [updatedProfile, ...archives];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newArchives));
  return newArchives;
};

export const deleteArchive = (id: string): UserProfile[] => {
  const archives = getArchives();
  const newArchives = archives.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newArchives));
  return newArchives;
};

export const updateArchiveTags = (id: string, tags: string[]): UserProfile[] => {
    const archives = getArchives();
    const index = archives.findIndex(p => p.id === id);
    if (index >= 0) {
        archives[index] = { ...archives[index], tags };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
    }
    return archives;
};

export const updateArchiveAvatar = (id: string, avatar: string): UserProfile[] => {
    const archives = getArchives();
    const index = archives.findIndex(p => p.id === id);
    if (index >= 0) {
        archives[index] = { ...archives[index], avatar };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
    }
    return archives;
};

export const updateArchiveName = (id: string, name: string): UserProfile[] => {
    const archives = getArchives();
    const index = archives.findIndex(p => p.id === id);
    if (index >= 0) {
        archives[index] = { ...archives[index], name };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
    }
    return archives;
};

export const saveAiReportToArchive = (id: string, reportContent: string): UserProfile[] => {
    const archives = getArchives();
    const index = archives.findIndex(p => p.id === id);
    if (index >= 0) {
        const profile = archives[index];
        const newReport: AiReportRecord = {
            id: Date.now().toString(),
            date: Date.now(),
            content: reportContent
        };
        const updatedReports = [newReport, ...(profile.aiReports || [])];
        
        archives[index] = { 
            ...profile, 
            aiReports: updatedReports, 
            lastUpdated: Date.now() 
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));
    }
    return archives;
}
