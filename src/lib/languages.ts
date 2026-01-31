import { LanguageConfig } from '@/types/compiler';

export const languages: LanguageConfig[] = [
  {
    id: 'python',
    name: 'Python',
    extension: '.py',
    monacoLanguage: 'python',
    icon: '🐍',
    defaultCode: `# Python 3
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    monacoLanguage: 'javascript',
    icon: '📜',
    defaultCode: `// JavaScript (Node.js)
function main() {
  console.log("Hello, World!");
}

main();
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    monacoLanguage: 'typescript',
    icon: '💠',
    defaultCode: `// TypeScript
function greet(name: string): void {
  console.log(\`Hello, \${name}!\`);
}

greet("World");
`,
  },
  {
    id: 'java',
    name: 'Java',
    extension: '.java',
    monacoLanguage: 'java',
    icon: '☕',
    defaultCode: `// Java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    monacoLanguage: 'cpp',
    icon: '⚡',
    defaultCode: `// C++
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
  },
  {
    id: 'c',
    name: 'C',
    extension: '.c',
    monacoLanguage: 'c',
    icon: '🔧',
    defaultCode: `// C
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
];

export const getLanguageById = (id: string): LanguageConfig | undefined => {
  return languages.find((lang) => lang.id === id);
};

export const getLanguageByExtension = (ext: string): LanguageConfig | undefined => {
  return languages.find((lang) => lang.extension === ext);
};
