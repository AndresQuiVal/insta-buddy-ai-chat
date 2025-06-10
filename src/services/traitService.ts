import { Trait } from './prospectAnalysisService';

export interface IdealTrait {
  trait: string;
  enabled: boolean;
  position: number;
}

export const loadIdealTraits = (): IdealTrait[] => {
  try {
    const traitsStr = localStorage.getItem('ideal-traits');
    if (!traitsStr) return [];
    
    const traits = JSON.parse(traitsStr);
    return traits.map((trait: any, index: number) => ({
      trait: trait.trait,
      enabled: trait.enabled,
      position: index + 1
    }));
  } catch (error) {
    console.error('Error loading ideal traits:', error);
    return [];
  }
}; 