const categories = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 
  'Trees', 'BST', 'Graphs', 'Greedy', 'Dynamic Programming', 
  'Recursion', 'Bit Manipulation', 'Math', 'Binary Search', 
  'Sliding Window', 'HashMap', 'Heap'
];

const difficulties = ['Easy', 'Medium', 'Hard'];

const generateChallenges = () => {
  const list = [];
  
  for (const cat of categories) {
    for (let i = 1; i <= 18; i++) {
      const difficulty = difficulties[(i - 1) % 3];
      const title = `${cat} Mastery: Challenge ${i}`;
      
      // Detailed description with examples and constraints
      const description = `### Problem Statement
You are presented with a technical challenge focusing on ${cat} data structures and algorithmic designs. This is practice problem #${i}.

Given input parameters representing standard datasets, write an optimized solution to evaluate the data, satisfying all performance and spacing bounds.

### Examples
#### Example 1
- **Input**: \`data = [1, 2, 3]\`
- **Output**: \`3\`
- **Explanation**: The size/count of elements in the given structure is 3.

#### Example 2
- **Input**: \`data = []\`
- **Output**: \`0\`
- **Explanation**: Empty structure returns zero.

### Constraints
- \`0 <= data.length <= 10^5\`
- \`Memory limit: 512 MB\`
- \`Time limit: 2.0s\``;

      // Boilerplate code templates matching language configurations
      const codeTemplates = {
        javascript: `function solve(data) {
    // Write your code here
    return data ? data.length : 0;
}

// Driver trigger for evaluation
solve([1, 2, 3]);`,
        python: `def solve(data):
    # Write your code here
    return len(data) if data else 0

# Driver trigger
solve([1, 2, 3])`,
        java: `public class Main {
    public static void main(String[] args) {
        // Write your code here
        System.out.println(3);
    }
}`,
        cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    cout << 3 << endl;
    return 0;
}`,
        c: `#include <stdio.h>

int main() {
    // Write your code here
    printf("%d\\n", 3);
    return 0;
}`
      };

      // Test cases (includes 1 visible test case and 2 hidden test cases)
      const testCases = [
        { input: '([1, 2, 3])', expectedOutput: '3', isHidden: false },
        { input: '([])', expectedOutput: '0', isHidden: true },
        { input: '([10, 20, 30, 40, 50])', expectedOutput: '5', isHidden: true }
      ];

      // Time and space complexity details
      const solution = {
        timeComplexity: difficulty === 'Easy' ? 'O(N)' : (difficulty === 'Medium' ? 'O(N log N)' : 'O(N^2)'),
        spaceComplexity: 'O(1)',
        explanation: `We scan through the elements. The time complexity grows linearly O(N) relative to the size of the inputs, while memory storage remains constant O(1).`
      };

      const companies = i % 2 === 0 
        ? ['Google', 'Amazon', 'TCS'] 
        : ['Microsoft', 'Facebook', 'Infosys', 'Wipro'];

      list.push({
        title,
        description,
        difficulty,
        category: cat,
        codeTemplates,
        companyTags: companies,
        testCases,
        solution,
        hints: [
          `Check if the inputs data structure is null or empty first.`,
          `Try implementing this using a single traversal iteration loop.`
        ]
      });
    }
  }
  
  return list;
};

module.exports = {
  challenges: generateChallenges()
};
