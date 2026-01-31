import { LanguageConfig } from '@/types/compiler';

export const languages: LanguageConfig[] = [
  {
    id: 'python',
    name: 'Python',
    extension: '.py',
    monacoLanguage: 'python',
    icon: '🐍',
    defaultCode: `# Python 3.11
# Supports: pip packages, stdin input, file I/O

def fibonacci(n: int) -> int:
    """Calculate nth Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print("Hello, World!")
    print(f"Fibonacci(10) = {fibonacci(10)}")

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
    defaultCode: `// JavaScript (Node.js 20)
// Supports: ES2023, npm packages, async/await

const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};

const asyncExample = async () => {
  const result = await Promise.resolve("Async works!");
  console.log(result);
};

// Main execution
greet("World");
asyncExample();
`,
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    monacoLanguage: 'typescript',
    icon: '💠',
    defaultCode: `// TypeScript 5.x
// Supports: Type inference, generics, decorators

interface User {
  name: string;
  age: number;
}

function greet<T extends User>(user: T): string {
  return \`Hello, \${user.name}! You are \${user.age} years old.\`;
}

const user: User = { name: "World", age: 25 };
console.log(greet(user));

// Arrow function with types
const add = (a: number, b: number): number => a + b;
console.log(\`2 + 3 = \${add(2, 3)}\`);
`,
  },
  {
    id: 'java',
    name: 'Java',
    extension: '.java',
    monacoLanguage: 'java',
    icon: '☕',
    defaultCode: `// Java 21
// Supports: Records, Pattern Matching, Virtual Threads

import java.util.List;
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Stream API example
        List<Integer> squares = IntStream.rangeClosed(1, 5)
            .map(n -> n * n)
            .boxed()
            .toList();
        
        System.out.println("Squares: " + squares);
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
    defaultCode: `// C++20
// Supports: STL, Ranges, Concepts, Coroutines

#include <iostream>
#include <vector>
#include <algorithm>
#include <ranges>

int main() {
    std::cout << "Hello, World!" << std::endl;
    
    // Modern C++ with ranges
    std::vector<int> nums = {1, 2, 3, 4, 5};
    
    auto squares = nums | std::views::transform([](int n) { 
        return n * n; 
    });
    
    std::cout << "Squares: ";
    for (int sq : squares) {
        std::cout << sq << " ";
    }
    std::cout << std::endl;
    
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
    defaultCode: `// C17 (GNU GCC)
// Supports: Standard library, POSIX functions

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    printf("Hello, World!\\n");
    
    int n = 5;
    printf("Factorial of %d is %d\\n", n, factorial(n));
    
    // Dynamic memory example
    int* arr = (int*)malloc(5 * sizeof(int));
    for (int i = 0; i < 5; i++) {
        arr[i] = i * 2;
    }
    
    printf("Array: ");
    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    free(arr);
    return 0;
}
`,
  },
  {
    id: 'go',
    name: 'Go',
    extension: '.go',
    monacoLanguage: 'go',
    icon: '🐹',
    defaultCode: `// Go 1.22
// Supports: Goroutines, Channels, Standard library

package main

import (
	"fmt"
	"sync"
)

func main() {
	fmt.Println("Hello, World!")
	
	// Goroutines example
	var wg sync.WaitGroup
	numbers := []int{1, 2, 3, 4, 5}
	
	for _, n := range numbers {
		wg.Add(1)
		go func(num int) {
			defer wg.Done()
			fmt.Printf("Square of %d is %d\\n", num, num*num)
		}(n)
	}
	
	wg.Wait()
}
`,
  },
  {
    id: 'rust',
    name: 'Rust',
    extension: '.rs',
    monacoLanguage: 'rust',
    icon: '🦀',
    defaultCode: `// Rust 1.75
// Supports: Ownership, Borrowing, Pattern matching

fn main() {
    println!("Hello, World!");
    
    // Vector and iterator example
    let numbers: Vec<i32> = (1..=5).collect();
    let squares: Vec<i32> = numbers.iter().map(|&x| x * x).collect();
    
    println!("Numbers: {:?}", numbers);
    println!("Squares: {:?}", squares);
    
    // Pattern matching
    let result = match squares.iter().sum::<i32>() {
        s if s > 50 => "Large sum",
        s if s > 20 => "Medium sum",
        _ => "Small sum",
    };
    
    println!("Result: {}", result);
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
