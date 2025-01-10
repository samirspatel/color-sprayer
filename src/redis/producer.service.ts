import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class ProducerService implements OnModuleInit, OnModuleDestroy {
  private isRunning = false;
  private messageCount = 0;
  // Color map to get RGB values
  private readonly colorMap = new Map<string, [number, number, number]>([
    ['Red', [255, 0, 0]],
    ['Green', [0, 255, 0]],
    ['Blue', [0, 0, 255]],
  ]);

  // Create a temporary div to convert color names to RGB
  private getColorRGB(colorName: string): [number, number, number] {
    const div = document.createElement('div');
    div.style.color = colorName;
    document.body.appendChild(div);
    const color = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    const match = color.match(/\d+/g);
    if (match) {
      return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
    }
    return [0, 0, 0];
  }

  // Calculate Euclidean distance between two RGB colors
  private colorDistance(
    color1: [number, number, number],
    color2: [number, number, number],
  ): number {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2),
    );
  }

  // Get the closest primary color
  private getClosestPrimaryColor(colorName: string): string {
    // Predefined RGB values for primary colors
    const primaryColors = {
      Red: [255, 0, 0],
      Green: [0, 255, 0],
      Blue: [0, 0, 255],
    };

    // Hardcoded RGB values for common colors to avoid browser DOM manipulation
    const commonColors: { [key: string]: [number, number, number] } = {
      Red: [255, 0, 0],
      Green: [0, 255, 0],
      Blue: [0, 0, 255],
      Yellow: [255, 255, 0],
      Purple: [128, 0, 128],
      Orange: [255, 165, 0],
      Black: [0, 0, 0],
      White: [255, 255, 255],
      Gray: [128, 128, 128],
      Pink: [255, 192, 203],
      Brown: [165, 42, 42],
      Cyan: [0, 255, 255],
      Magenta: [255, 0, 255],
      // Add approximate RGB values for other colors
      LightBlue: [173, 216, 230],
      DarkBlue: [0, 0, 139],
      LightGreen: [144, 238, 144],
      DarkGreen: [0, 100, 0],
      LightRed: [255, 102, 102],
      DarkRed: [139, 0, 0],
      // Add more as needed
    };

    let targetRGB: [number, number, number];
    if (colorName in commonColors) {
      targetRGB = commonColors[colorName];
    } else {
      // For unknown colors, make an educated guess based on the name
      if (
        colorName.includes('Red') ||
        colorName.includes('Pink') ||
        colorName.includes('Crimson')
      ) {
        targetRGB = [255, 0, 0];
      } else if (colorName.includes('Green')) {
        targetRGB = [0, 255, 0];
      } else if (colorName.includes('Blue')) {
        targetRGB = [0, 0, 255];
      } else {
        // Default to analyzing the name components
        const isLight = colorName.includes('Light');
        const isDark = colorName.includes('Dark');
        const baseValue = isDark ? 100 : isLight ? 200 : 150;

        if (colorName.includes('Yellow') || colorName.includes('Gold')) {
          targetRGB = [255, 255, baseValue];
        } else if (
          colorName.includes('Purple') ||
          colorName.includes('Violet')
        ) {
          targetRGB = [baseValue, 0, baseValue];
        } else {
          // Default to a neutral color if we can't determine
          targetRGB = [baseValue, baseValue, baseValue];
        }
      }
    }

    let closestColor = 'Red';
    let minDistance = Number.MAX_VALUE;

    for (const [color, rgb] of Object.entries(primaryColors)) {
      const distance = this.colorDistance(
        targetRGB,
        rgb as [number, number, number],
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    return closestColor;
  }

  // List of HTML color names
  private readonly colors = [
    'AliceBlue',
    'AntiqueWhite',
    'Aqua',
    'Aquamarine',
    'Azure',
    'Beige',
    'Bisque',
    'Black',
    'BlanchedAlmond',
    'Blue',
    'BlueViolet',
    'Brown',
    'BurlyWood',
    'CadetBlue',
    'Chartreuse',
    'Chocolate',
    'Coral',
    'CornflowerBlue',
    'Cornsilk',
    'Crimson',
    'Cyan',
    'DarkBlue',
    'DarkCyan',
    'DarkGoldenRod',
    'DarkGray',
    'DarkGreen',
    'DarkKhaki',
    'DarkMagenta',
    'DarkOliveGreen',
    'DarkOrange',
    'DarkOrchid',
    'DarkRed',
    'DarkSalmon',
    'DarkSeaGreen',
    'DarkSlateBlue',
    'DarkSlateGray',
    'DarkTurquoise',
    'DarkViolet',
    'DeepPink',
    'DeepSkyBlue',
    'DimGray',
    'DodgerBlue',
    'FireBrick',
    'FloralWhite',
    'ForestGreen',
    'Fuchsia',
    'Gainsboro',
    'GhostWhite',
    'Gold',
    'GoldenRod',
    'Gray',
    'Green',
    'GreenYellow',
    'HoneyDew',
    'HotPink',
    'IndianRed',
    'Indigo',
    'Ivory',
    'Khaki',
    'Lavender',
    'LavenderBlush',
    'LawnGreen',
    'LemonChiffon',
    'LightBlue',
    'LightCoral',
    'LightCyan',
    'LightGoldenRodYellow',
    'LightGray',
    'LightGreen',
    'LightPink',
    'LightSalmon',
    'LightSeaGreen',
    'LightSkyBlue',
    'LightSlateGray',
    'LightSteelBlue',
    'LightYellow',
    'Lime',
    'LimeGreen',
    'Linen',
    'Magenta',
    'Maroon',
    'MediumAquaMarine',
    'MediumBlue',
    'MediumOrchid',
    'MediumPurple',
    'MediumSeaGreen',
    'MediumSlateBlue',
    'MediumSpringGreen',
    'MediumTurquoise',
    'MediumVioletRed',
    'MidnightBlue',
    'MintCream',
    'MistyRose',
    'Moccasin',
    'NavajoWhite',
    'Navy',
    'OldLace',
    'Olive',
    'OliveDrab',
    'Orange',
    'OrangeRed',
    'Orchid',
    'PaleGoldenRod',
    'PaleGreen',
    'PaleTurquoise',
    'PaleVioletRed',
    'PapayaWhip',
    'PeachPuff',
    'Peru',
    'Pink',
    'Plum',
    'PowderBlue',
    'Purple',
    'RebeccaPurple',
    'Red',
    'RosyBrown',
    'RoyalBlue',
    'SaddleBrown',
    'Salmon',
    'SandyBrown',
    'SeaGreen',
    'SeaShell',
    'Sienna',
    'Silver',
    'SkyBlue',
    'SlateBlue',
    'SlateGray',
    'Snow',
    'SpringGreen',
    'SteelBlue',
    'Tan',
    'Teal',
    'Thistle',
    'Tomato',
    'Turquoise',
    'Violet',
    'Wheat',
    'White',
    'WhiteSmoke',
    'Yellow',
    'YellowGreen',
  ];

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    this.startProducing();
  }

  onModuleDestroy() {
    this.stopProducing();
  }

  private startProducing() {
    this.isRunning = true;
    this.produceMessages();
  }

  private stopProducing() {
    this.isRunning = false;
  }

  private getRandomColor(): string {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  private async produceMessages() {
    while (this.isRunning) {
      try {
        const color = this.getRandomColor();
        const message = {
          id: ++this.messageCount,
          timestamp: new Date().toISOString(),
          data: `Message ${this.messageCount}`,
          color: color,
          primaryColor: this.getClosestPrimaryColor(color),
        };

        await this.redisService.enqueue(JSON.stringify(message));

        // Optional: Add a small delay to prevent overwhelming the system
        // await new Promise(resolve => setTimeout(resolve, 1));
      } catch (error) {
        console.error('Error producing message:', error);
        // Add a small delay on error to prevent tight error loops
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  getMessageCount(): number {
    return this.messageCount;
  }
}
