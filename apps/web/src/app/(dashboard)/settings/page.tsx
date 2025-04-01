"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner"
import { AlertCircle, Copy, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { authClient } from '@/lib/api/publicClient';



export default function Settings() {

  const [newKeyName, setNewKeyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const {data} = authClient.keys.getKeys.useQuery({
    queryKey: ["keys"]})

  const apiKeys = data?.status === 200 ? data.body : [];
  const queryClient = authClient.useQueryClient();
  const { mutate: create } = authClient.keys.createKey.useMutation({})
  
  const createApiKey = async () => {
    if (!newKeyName) {
      toast("Key name is required.");
      return;
    }

    create({
      body: {
        name: newKeyName,
      }
    }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["keys"] });
        toast.success( "API key created successfully.");
      },
      onError: (error) => {
        toast.error("Failed to create API key. Please try again.");
      }
    });
  }
  

  const revokeApiKey = async (keyId: number) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to revoke API key');
      
     
      toast("API key revoked successfully.");
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast("Failed to revoke API key. Please try again.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API key copied to clipboard.");
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Manage your API keys for programmatic access to the API.
        </p>
      </div>

      {newKey && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              New API Key Created
            </CardTitle>
            <CardDescription>
              This is the only time your API key will be displayed. Please copy it now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input 
                value={newKey} 
                readOnly 
                className="font-mono bg-white dark:bg-gray-800"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => copyToClipboard(newKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setNewKey(null)}>
              Dismiss
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New API Key</CardTitle>
          <CardDescription>
            Create a new API key to access the API programmatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="My API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <Button onClick={createApiKey} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create API Key"}
              <Plus className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your existing API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              You don't have any API keys yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>{format(new Date(key.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {key.key}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {}}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Revoke</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
