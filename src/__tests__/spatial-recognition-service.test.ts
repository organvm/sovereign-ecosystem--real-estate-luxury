import { describe, expect, it } from 'vitest';
import { spatialRecognitionService } from '../lib/spatial-recognition-service';

describe('spatialRecognitionService template catalog', () => {
  it('returns the expected room templates with measurement presets', () => {
    const templates = spatialRecognitionService.getRoomTemplates();

    expect(templates.map(template => template.id)).toEqual([
      'kitchen',
      'bedroom',
      'bathroom',
      'living-room',
      'dining-room',
      'office',
      'hallway',
      'closet',
    ]);
    expect(templates.every(template => template.measurements.length > 0)).toBe(true);
    expect(templates.every(template => template.spatialFeatures.length > 0)).toBe(true);
  });

  it('looks up templates by id and case-insensitive name', () => {
    const kitchen = spatialRecognitionService.getTemplateById('kitchen');
    const livingRoom = spatialRecognitionService.getTemplateByName('living room');

    expect(kitchen?.name).toBe('Kitchen');
    expect(kitchen?.spatialFeatures).toContain('sink');
    expect(kitchen?.measurements.map(measurement => measurement.id)).toEqual([
      'kitchen-width',
      'kitchen-length',
      'counter-height',
      'island-width',
      'cabinet-depth',
    ]);
    expect(livingRoom?.id).toBe('living-room');
  });

  it('suggests measurements for known room names and returns none for unknown rooms', () => {
    const bathroomMeasurements = spatialRecognitionService.suggestMeasurements('Bathroom');

    expect(bathroomMeasurements.map(measurement => measurement.id)).toEqual([
      'bathroom-width',
      'bathroom-length',
      'shower-width',
      'vanity-width',
    ]);
    expect(spatialRecognitionService.suggestMeasurements('Wine Cellar')).toEqual([]);
  });
});

describe('spatialRecognitionService analyzeSpace', () => {
  it('detects an exact kitchen match and caps confidence at 95', () => {
    const analysis = spatialRecognitionService.analyzeSpace(10, 12, 9);

    expect(analysis.detectedRoomType).toBe('Kitchen');
    expect(analysis.confidence).toBe(95);
    expect(analysis.suggestedTemplate).toMatchObject({
      id: 'kitchen',
      confidence: 95,
    });
    expect(analysis.dimensions).toEqual({
      width: 10,
      length: 12,
      height: 9,
      area: 120,
      volume: 1080,
    });
    expect(analysis.matchedFeatures).toEqual(['counters', 'cabinets', 'appliances', 'sink']);
  });

  it('detects a hallway for narrow corridor dimensions', () => {
    const analysis = spatialRecognitionService.analyzeSpace(4, 10, 9);

    expect(analysis.detectedRoomType).toBe('Hallway');
    expect(analysis.confidence).toBe(95);
    expect(analysis.suggestedTemplate.id).toBe('hallway');
    expect(analysis.matchedFeatures).toEqual(['doors', 'walls', 'narrow']);
  });

  it('reduces confidence when the best-matching room is outside a typical range', () => {
    const analysis = spatialRecognitionService.analyzeSpace(2, 10, 9);

    expect(analysis.detectedRoomType).toBe('Hallway');
    expect(analysis.confidence).toBeCloseTo(72.5, 5);
    expect(analysis.confidence).toBeLessThan(95);
    expect(analysis.dimensions.area).toBe(20);
    expect(analysis.dimensions.volume).toBe(180);
  });
});
