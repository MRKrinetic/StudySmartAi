import * as monaco from 'monaco-editor';
import { LanguageConfiguration } from '@/types';

// Language configurations for all supported file types
export const LANGUAGE_CONFIGURATIONS: Record<string, LanguageConfiguration> = {
  txt: {
    id: 'plaintext',
    extensions: ['.txt'],
    aliases: ['Plain Text', 'text'],
    mimetypes: ['text/plain'],
  },
  md: {
    id: 'markdown',
    extensions: ['.md', '.markdown'],
    aliases: ['Markdown'],
    mimetypes: ['text/markdown'],
    configuration: {
      comments: {
        blockComment: ['<!--', '-->'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '`', close: '`' },
      ],
      surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
        ['`', '`'],
      ],
    },
  },
  py: {
    id: 'python',
    extensions: ['.py', '.pyw'],
    aliases: ['Python'],
    mimetypes: ['text/x-python'],
    configuration: {
      comments: {
        lineComment: '#',
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
      ],
      surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
      ],
      folding: {
        markers: {
          start: /^\s*#\s*region\b/,
          end: /^\s*#\s*endregion\b/,
        },
      },
    },
  },
  js: {
    id: 'javascript',
    extensions: ['.js', '.jsx', '.mjs'],
    aliases: ['JavaScript', 'javascript', 'js'],
    mimetypes: ['text/javascript', 'application/javascript'],
    configuration: {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
        { open: '`', close: '`', notIn: ['string', 'comment'] },
        { open: '/**', close: ' */', notIn: ['string'] },
      ],
      surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
        ['`', '`'],
      ],
      folding: {
        markers: {
          start: /^\s*\/\/#region\b/,
          end: /^\s*\/\/#endregion\b/,
        },
      },
    },
  },
  cpp: {
    id: 'cpp',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    aliases: ['C++', 'Cpp', 'cpp'],
    mimetypes: ['text/x-c++src', 'text/x-c++hdr'],
    configuration: {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] },
      ],
      surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
      ],
      folding: {
        markers: {
          start: /^\s*#pragma\s+region\b/,
          end: /^\s*#pragma\s+endregion\b/,
        },
      },
    },
  },
  json: {
    id: 'json',
    extensions: ['.json'],
    aliases: ['JSON'],
    mimetypes: ['application/json'],
    configuration: {
      brackets: [
        ['{', '}'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '"', close: '"', notIn: ['string'] },
      ],
      surroundingPairs: [
        ['{', '}'],
        ['[', ']'],
        ['"', '"'],
      ],
    },
  },
  csv: {
    id: 'csv',
    extensions: ['.csv'],
    aliases: ['CSV', 'Comma Separated Values'],
    mimetypes: ['text/csv'],
    configuration: {
      autoClosingPairs: [
        { open: '"', close: '"', notIn: ['string'] },
      ],
      surroundingPairs: [
        ['"', '"'],
      ],
    },
  },
};

// Custom CSV language definition for Monaco
export const CSV_LANGUAGE_DEFINITION = {
  tokenizer: {
    root: [
      [/"[^"]*"/, 'string.quoted'],
      [/[^,\n\r"]+/, 'text'],
      [/,/, 'delimiter'],
      [/[\n\r]+/, 'linebreak'],
    ],
  },
};

// Custom dark theme for better syntax highlighting
export const CUSTOM_DARK_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'string.quoted', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'delimiter', foreground: 'D4D4D4' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'linebreak', foreground: 'D4D4D4' },
    { token: 'text', foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2d2d30',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
    'editorCursor.foreground': '#aeafad',
    'editorWhitespace.foreground': '#404040',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
  },
};

// Custom light theme for better syntax highlighting
export const CUSTOM_LIGHT_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '008000' },
    { token: 'keyword', foreground: '0000FF' },
    { token: 'string', foreground: 'A31515' },
    { token: 'string.quoted', foreground: 'A31515' },
    { token: 'number', foreground: '098658' },
    { token: 'delimiter', foreground: '000000' },
    { token: 'operator', foreground: '000000' },
    { token: 'type', foreground: '267F99' },
    { token: 'function', foreground: '795E26' },
    { token: 'variable', foreground: '001080' },
    { token: 'linebreak', foreground: '000000' },
    { token: 'text', foreground: '000000' },
  ],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f7f7f7',
    'editor.selectionBackground': '#add6ff',
    'editor.inactiveSelectionBackground': '#e5ebf1',
    'editorCursor.foreground': '#000000',
    'editorWhitespace.foreground': '#bfbfbf',
    'editorIndentGuide.background': '#d3d3d3',
    'editorIndentGuide.activeBackground': '#939393',
    'editorLineNumber.foreground': '#237893',
    'editorLineNumber.activeForeground': '#0b216f',
  },
};

// Function to register all languages and themes
export const registerLanguagesAndThemes = (monaco: typeof import('monaco-editor')) => {
  // Register custom CSV language
  monaco.languages.register({ id: 'csv' });
  monaco.languages.setMonarchTokensProvider('csv', CSV_LANGUAGE_DEFINITION);

  // Register language configurations
  Object.values(LANGUAGE_CONFIGURATIONS).forEach((config) => {
    if (config.configuration) {
      monaco.languages.setLanguageConfiguration(config.id, config.configuration);
    }
  });

  // Register custom themes
  monaco.editor.defineTheme('custom-dark', CUSTOM_DARK_THEME);
  monaco.editor.defineTheme('custom-light', CUSTOM_LIGHT_THEME);
};

// Helper function to get Monaco language from file extension
export const getMonacoLanguage = (fileType: string): string => {
  const config = LANGUAGE_CONFIGURATIONS[fileType];
  return config ? config.id : 'plaintext';
};

// Helper function to get file type from filename
export const getFileTypeFromName = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  // Map common extensions to our supported types
  const extensionMap: Record<string, string> = {
    'txt': 'txt',
    'md': 'md',
    'markdown': 'md',
    'py': 'py',
    'pyw': 'py',
    'js': 'js',
    'jsx': 'js',
    'mjs': 'js',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'hpp': 'cpp',
    'h': 'cpp',
    'json': 'json',
    'csv': 'csv',
  };

  return extensionMap[extension || ''] || 'txt';
};
